import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import '../App.css';
import { abi } from './abi';
import { tokenAbi } from './tokenAbi';


const TokenDetail = () => {
    const { tokenAddress } = useParams();
    const location = useLocation();
    const { card } = location.state || {};

    // Thiết lập thông tin token
    const [owners, setOwners] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalSupply, setTotalSupply] = useState('0');
    const [remainingTokens, setRemainingTokens] = useState('0');
    const [purchaseAmount, setPurchaseAmount] = useState('');
    const [cost, setCost] = useState('0');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate(); 
    const [sellAmount, setSellAmount] = useState('');

    //Check list Uniswap
    const UNISWAP_FACTORY = '0xF62c03E08ada871A0bEb309762E260a7a6a880E6'; // bạn cần đúng địa chỉ cho testnet
    const UNISWAP_FACTORY_ABI = [ // Chỉ cần hàm getPair
    "function getPair(address tokenA, address tokenB) external view returns (address pair)"
    ];
    const WETH_ADDRESS = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'; // Thường Uniswap pair là token/WETH
    const [pairAddress, setPairAddress] = useState(null);


    const tokenDetails = card || {
        name: 'Unknown',
        symbol: 'Unknown',
        description: 'No description available',
        tokenImageUrl: 'https://via.placeholder.com/200',
        fundingRaised: '0 ETH',
        creatorAddress: '0x0000000000000000000000000000000000000000',
    };

    const fundingRaised = parseFloat(tokenDetails.fundingRaised.replace(' ETH',''));

    // Constants
    const fundingGoal = 24;
    const maxSupply = parseInt(800000);


    useEffect(() => {
        const checkUniswapListing = async () => {
            try {
            const provider = new ethers.JsonRpcProvider(process.env.REACT_APP_RPC_URL);
            const factory = new ethers.Contract(UNISWAP_FACTORY, UNISWAP_FACTORY_ABI, provider);
            const pair = await factory.getPair(tokenAddress, WETH_ADDRESS);
            
            if (pair !== ethers.ZeroAddress) {
                setPairAddress(pair);
            }
            } catch (error) {
            console.error('Error checking Uniswap pair:', error);
            }
        };

        if (fundingRaised >= 24) {
            checkUniswapListing();
        }
    }, [tokenAddress, fundingRaised]);

    useEffect(() => {
        const fetchData = async() => {
            try {
                const ownersResponse = await fetch(
                    `https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/owners?chain=sepolia&order=DESC`,
                    {
                        headers: {
                            accept: 'application/json',
                            'X-API-Key': process.env.REACT_APP_X_API_KEY,
                        },
                    }
                );
                const ownerData = await ownersResponse.json();
                setOwners(ownerData.result || []);

                const transfersResponse = await fetch(
                    `https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/transfers?chain=sepolia&order=DESC`,
                    {
                        headers: {
                            accept: 'application/json',
                            'X-API-Key': process.env.REACT_APP_X_API_KEY,
                        },
                    }
                );
                const transfersData = await transfersResponse.json();
                setTransfers(transfersData.result || []);

                // Đồng bộ tổng cung
                const provider = new ethers.JsonRpcProvider(process.env.REACT_APP_RPC_URL);
                const contract = new ethers.Contract(tokenAddress, tokenAbi, provider);
                const totalSupplyRespone = await contract.totalSupply();
                var totalSupplyFormatted = parseInt(ethers.formatUnits(totalSupplyRespone, 'ether')) - 200000;

                setTotalSupply(totalSupplyFormatted);

                // Tính toán số token còn sót lại
                setRemainingTokens(maxSupply - totalSupplyFormatted);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tokenAddress]);

    // Tính toán % của thanh bar
    const fundingRaisedPercentage = (fundingRaised/fundingGoal) * 100;
    // const totalSupplyPercentage = ((parseFloat(totalSupply) - 200000) / ethers.formatUnits(maxSupply - 200000, 'ether')) * 100;
    const totalSupplyPercentage = (parseFloat(remainingTokens) / 800000) * 100;

    // Hàm lấy giá trị để mua 1 lượng token
    const getCost = async () => {
        try {
            const provider = new ethers.JsonRpcProvider(process.env.REACT_APP_RPC_URL);
            const contract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, abi, provider);
            const costInWei = await contract.calculateCost(totalSupply, purchaseAmount);
            setCost(ethers.formatUnits(costInWei, 'ether'));
            setIsModalOpen(true); 
        } catch (error) {
            console.error('Error calculating cost:', error);
        }
    };

    // Hàm để thực hiện lệnh mua
    const handlePurchase = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            console.log(signer);
            const contract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, abi, signer);

            const transaction = await contract.buyMemeToken(tokenAddress, purchaseAmount, {
                value: ethers.parseUnits(cost, 'ether'),
            });
            const receipt = await transaction.wait();

            alert(`Transaction successful! Hash: ${receipt.hash}`);
            setIsModalOpen(false);
        } catch(error) {
            console.error('Error during purchase:', error);
        }
    };

    const handleSell = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, abi, signer);

            // Gọi hàm sell token trên smart contract
            const tx = await contract.sellMemeToken(tokenAddress, sellAmount);
            const receipt = await tx.wait();

            alert(`Sell transaction successful! Hash: ${receipt.transactionHash}`);
            setSellAmount(''); // reset input sau khi bán xong
        } catch(error) {
            console.error('Error during selling:', error);
            alert('Error when selling tokens. See console for details.');
        }
    };

    return (
        <div className='token-detail-container'>
            <h3 className='start-new-coin' onClick={() => navigate('/')}>[go back]</h3>
            <div className='token-details-section'>
                <div className='token-details'>
                <h2>Token Detail for {tokenDetails.name}</h2>
                <img src={tokenDetails.tokenImageUrl} alt={tokenDetails.name} className='token-detail-image'/>
                <p><strong>Creator Address:</strong> {tokenDetails.creatorAddress}</p>
                <p><strong>Token Address:</strong> {tokenAddress}</p>
                <p><strong>Funding Raised:</strong> {tokenDetails.fundingRaised}</p>
                <p><strong>Token Symbol:</strong> {tokenDetails.symbol}</p>
                <p><strong>Description:</strong> {tokenDetails.description}</p>
                </div>

                <div className="right-column">
                    <div className="progress-bars">
                        <div className="progress-container">
                            <p><strong>Bonding Curve Progress:</strong> {fundingRaised} / {fundingGoal} ETH</p>
                            <div className="progress-bar">
                                <div className="progress" style={{ width: `${fundingRaisedPercentage}%` }}></div>
                            </div>
                            <p>When the market cap reaches {fundingGoal} ETH, all the liquidity from the bonding curve will be deposited into Uniswap, and the LP tokens will be burned. Progression increases as the price goes up.</p>
                        </div>

                        <div className="progress-container">
                            <p><strong>Remaining Tokens Available for Sale:</strong> {remainingTokens} / 800,000</p>
                            <div className="progress-bar">
                                <div className="progress" style={{ width: `${totalSupplyPercentage}%` }}></div>
                                <div>{totalSupplyPercentage}</div>
                            </div>
                        </div>
                    </div>

                    {pairAddress ? (
                        <div style={{ marginTop: '20px' }} className='buy-tokens'>
                            <h3>This token is listed on Uniswap!</h3>
                            <p>Pair Address: <a href={`https://sepolia.etherscan.io/address/${pairAddress}`} target="_blank" rel="noopener noreferrer" className='link-ether'>{pairAddress}</a></p>
                            <a
                            href={`https://app.uniswap.org/#/swap?outputCurrency=${tokenAddress}&chain=sepolia`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="buy-button"
                            >
                            Trade on Uniswap
                            </a>
                        </div>
                    ) : (
                        <div>
                            <div className='buy-tokens'>
                                <h3>Buy Tokens</h3>
                                <input type="number"
                                    placeholder='Enter amount of tokens to buy'
                                    value={purchaseAmount}
                                    onChange={(e) => setPurchaseAmount(e.target.value)}
                                    className='buy-input' 
                                />
                                <button onClick={getCost} className='buy-button'>Purchase</button>
                            </div>

                            <div className='buy-tokens' style={{ marginTop: '20px' }}>
                                <h3>Sell Tokens</h3>
                                <input type="number"
                                    placeholder='Enter amount of tokens to sell'
                                    value={sellAmount}
                                    onChange={(e) => setSellAmount(e.target.value)}
                                    className='buy-input' 
                                />
                                <button onClick={handleSell} className='buy-button'>Sell Tokens</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {isModalOpen && (
                <div className='modal'>
                    <div className='modal-content'>
                        <h4>Confirm Purchase</h4>
                        <p>Cost of {purchaseAmount} tokens: {cost} ETH</p>
                        <button onClick={handlePurchase} className='confirm-button'>Confirm</button>
                        <button onClick={() => setIsModalOpen(false)} className='cancel-button'>Cancel</button>
                    </div>
                </div>
            )}

            <h3>Owners</h3>
            {loading ? (
                <p>Loading owners...</p>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Owner Address</th>
                            <th>Percentage of Total Supply</th>
                        </tr>
                    </thead>
                    <tbody>
                        {owners.map((owner, index) => (
                        <tr key={index}>
                            <td>{owner.owner_address}</td>
                            <td>{owner.percentage_relative_to_total_supply}%</td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            )}


            <h3>Transfers</h3>
            {loading ? (
                <p>Loading transfers...</p>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>type</th>
                            <th>account</th>
                            <th>{tokenDetails.symbol}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transfers.map((transfer, index) => {
                            let type;
                            let colors;
                            if (transfer.from_address === "0x0000000000000000000000000000000000000000") {
                                type = "buy";
                                colors = "#7CEEA5";
                            } else if (transfer.to_address === "0x0000000000000000000000000000000000000000") {
                                type = "sell";
                                colors = "#E77B59";
                            } else {
                                type = "transfer";
                                colors = "white";
                            }
                            return (
                                <tr key={index}>
                                    <td><a style={{color:colors}} href={`https://sepolia.etherscan.io/tx/${transfer.transaction_hash}`} target="_blank" rel="noopener noreferrer">{type}</a></td>
                                    <td>{transfer.from_address === "0x0000000000000000000000000000000000000000" ? transfer.to_address : transfer.from_address}</td>
                                    <td>{transfer.value_decimal}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default TokenDetail;