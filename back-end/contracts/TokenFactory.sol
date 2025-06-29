// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import "./Token.sol";
import "hardhat/console.sol";
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol';
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

contract TokenFactory {

    // Cấu trúc của 1 token
    struct memeToken{
        string name;
        string symbol;
        string description;
        string tokenImageUrl;
        uint fundingRaised;
        address tokenAddress;
        address creatorAddress;
    }

    address[] public memeTokenAddresses;

    uint constant DECIMALS = 10 ** 18;
    uint constant MAX_SUPPLY = 1000000 * DECIMALS; //Cung tối đa 1 triệu token
    uint constant INIT_SUPPPLY = 20 * MAX_SUPPLY / 100; //Cung ban đầu là 20% của cung tối đa

    uint constant MEMETOKEN_CREATION_FEE = 0.0001 ether; //Phí tạo token

    uint constant MEMECOIN_FUNDING_GOAL = 24 ether;

    address constant UNISWAP_V2_FACTORY_ADDRESS = 0xF62c03E08ada871A0bEb309762E260a7a6a880E6;
    address constant UNISWAP_V2_ROUTER_ADDRESS = 0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3;

    uint256 public constant INITIAL_PRICE = 30000000000000;  // Initial price in wei (P0), 3.00 * 10^13
    uint256 public constant K = 8 * 10**15;  // Growth rate (k), scaled to avoid precision loss (0.01 * 10^18)

    mapping(address => memeToken) public addressToMemeTokenMapping;

    function createMemeToken(string memory name, string memory symbol, string memory description, 
    string memory imageUrl) public payable returns(address) {

        require(msg.value >= MEMETOKEN_CREATION_FEE, "Invalid token creation fee");
        Token memeTokenCt = new Token(name,symbol,INIT_SUPPPLY, address(this));
        address memeTokenAddress = address(memeTokenCt);
        memeToken memory newlyCreatedToken = memeToken(name,symbol,description,imageUrl,0,memeTokenAddress,msg.sender);
        memeTokenAddresses.push(memeTokenAddress);
        addressToMemeTokenMapping[memeTokenAddress] = newlyCreatedToken;
        console.log(memeTokenAddress);
        return memeTokenAddress;
    }

    // Tính toán số lượng "tokensToBuy" từ "currentSupply"
    function calculateCost(uint256 currentSupply, uint256 tokensToBuy) public pure returns (uint256) {
        
        // Exponential Bonding Curve

        // Calculate the exponent parts scaled to avoid precision loss
        uint256 exponent1 = (K * (currentSupply + tokensToBuy)) / 10**18;
        uint256 exponent2 = (K * currentSupply) / 10**18;

        // Calculate e^(kx) using the exp function
        uint256 exp1 = exp(exponent1);
        uint256 exp2 = exp(exponent2);

        // Công thức Cost: (P0 / k) * (e^(k * (currentSupply + tokensToBuy)) - e^(k * currentSupply))
        // We use (P0 * 10^18) / k to keep the division safe from zero
        uint256 cost = (INITIAL_PRICE * 10**18 * (exp1 - exp2)) / K;  // Adjust for k scaling without dividing by zero
        return cost;
    }

    // Improved helper function to calculate e^x for larger x using a Taylor series approximation
    function exp(uint256 x) internal pure returns (uint256) {
        uint256 sum = 10**18;  // Start with 1 * 10^18 for precision
        uint256 term = 10**18;  // Initial term = 1 * 10^18
        uint256 xPower = x;  // Initial power of x
        
        for (uint256 i = 1; i <= 20; i++) {  // Increase iterations for better accuracy
            term = (term * xPower) / (i * 10**18);  // x^i / i!
            sum += term;

            // Prevent overflow and unnecessary calculations
            if (term < 1) break;
        }

        return sum;
    }

    function getAllMemeTokens() public view returns(memeToken[] memory) {
        memeToken[] memory allTokens = new memeToken[](memeTokenAddresses.length);
        for (uint i = 0; i < memeTokenAddresses.length; i++) {
            allTokens[i] = addressToMemeTokenMapping[memeTokenAddresses[i]];
        }
        return allTokens;
    }

    function buyMemeToken(address memeTokenAddress, uint purchaseQty) public payable returns(uint) {
        require(addressToMemeTokenMapping[memeTokenAddress].tokenAddress != address(0),"Token is not exist");

        memeToken storage listedToken = addressToMemeTokenMapping[memeTokenAddress];


        // Yêu cầu token chưa đạt FundingRasie
        require(listedToken.fundingRaised <= MEMECOIN_FUNDING_GOAL, "Funding has already been raised");

        Token tokenCt = Token(memeTokenAddress);

        uint currentSupply = tokenCt.totalSupply();
        uint availableSupply = MAX_SUPPLY - currentSupply;

        uint availableSupplyScaled = availableSupply / DECIMALS;
        uint purchaseQtyScaled = purchaseQty * DECIMALS;

        require(purchaseQty <= availableSupplyScaled, "Not enough supply");

        // tính toán chi phí và số token nhận được (Bonding Curve) 
        uint currentSupplyScaled = (currentSupply - INIT_SUPPPLY) / DECIMALS;
        uint requiredEth = calculateCost(currentSupplyScaled, purchaseQty);

        console.log("Required eth for purchase is ", requiredEth);

        require(msg.value >= requiredEth, "Incorrect value of ETH sent");

        listedToken.fundingRaised += msg.value;

        tokenCt.mint(purchaseQtyScaled,msg.sender);

        console.log("User token balance is ",tokenCt.balanceOf(msg.sender));

        if (listedToken.fundingRaised >= MEMECOIN_FUNDING_GOAL) {
            // tạo pool trên Uniswap
            address pool = _createLiquidityPool(memeTokenAddress);
            console.log("pool created address is ", pool);

            // cung cấp thanh khoản vào cổng pool
            uint ethAmount = listedToken.fundingRaised;
            uint liquidity = _provideLiquidity(memeTokenAddress,INIT_SUPPPLY,ethAmount);
            console.log("Liquidity added to pool ", liquidity);
            // đốt lượng token ở liquid trong liquidity position

            _burnlpTokens(pool, liquidity);
        }

        return requiredEth;
    }

    function _createLiquidityPool(address memeTokenAddress) internal returns(address) {

        IUniswapV2Factory factory = IUniswapV2Factory(UNISWAP_V2_FACTORY_ADDRESS);
        IUniswapV2Router01 router = IUniswapV2Router01(UNISWAP_V2_ROUTER_ADDRESS);
        address pair = factory.createPair(memeTokenAddress, router.WETH());
        return pair;
    }

    function _provideLiquidity(address memeTokenAddress, uint tokenAmount, uint ethAmount) internal returns(uint) {
        Token memeTokenCt = Token(memeTokenAddress);
        memeTokenCt.approve(UNISWAP_V2_ROUTER_ADDRESS, tokenAmount);
        IUniswapV2Router01 router = IUniswapV2Router01(UNISWAP_V2_ROUTER_ADDRESS);
        (uint amountToken, uint amountETH, uint liquidity) = router.addLiquidityETH{
            value: ethAmount
        }(memeTokenAddress, tokenAmount, tokenAmount, ethAmount, address(this), block.timestamp);

        return liquidity;
    }

    function _burnlpTokens(address pool, uint liquidity) internal returns(uint){
        IUniswapV2Pair uniswapv2pairct = IUniswapV2Pair(pool);
        uniswapv2pairct.transfer(address(0), liquidity);
        console.log("LP Tokens burnt ", liquidity);
        return 1;
    }

    function sellMemeToken(address memeTokenAddress, uint amountToSell) public returns (uint refundAmount) {
        // Kiểm tra token có tồn tại không
        require(addressToMemeTokenMapping[memeTokenAddress].tokenAddress != address(0), "Token does not exist");

        Token tokenCt = Token(memeTokenAddress);
        memeToken storage listedToken = addressToMemeTokenMapping[memeTokenAddress];

        // Chuyển đổi về đơn vị bình thường (vì eth lấy tận 18 đơn vị thập phân)
        uint amountToSellScaled = amountToSell * DECIMALS;

        // Kiểm tra user có đủ balance
        require(tokenCt.balanceOf(msg.sender) >= amountToSellScaled, "Not enough token balance");

        // Tính toán supply hiện tại
        uint currentSupply = tokenCt.totalSupply();
        uint currentSupplyScaled = (currentSupply - INIT_SUPPPLY) / DECIMALS;

        // Tính số tiền sẽ refund từ bonding curve
        uint refund = calculateRefund(currentSupplyScaled, amountToSell);

        // Burn token của user
        tokenCt.burn(msg.sender, amountToSellScaled);

        // Chuyển ETH cho user
        require(address(this).balance >= refund, "Not enough ETH in contract");
        payable(msg.sender).transfer(refund);

        return refund;
    }

    function calculateRefund(uint256 currentSupply, uint256 tokensToSell) public pure returns (uint256) {
        uint256 exponent1 = (K * currentSupply) / 10**18;
        uint256 exponent2 = (K * (currentSupply - tokensToSell)) / 10**18;

        uint256 exp1 = exp(exponent1);
        uint256 exp2 = exp(exponent2);

        uint256 refund = (INITIAL_PRICE * 10**18 * (exp1 - exp2)) / K;
        return refund;
    }

}