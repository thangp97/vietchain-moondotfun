import React, { useState, useEffect } from 'react';
import '../App.css'; 
import { useNavigate } from 'react-router-dom';
const { ethers } = require('ethers');
const {abi} = require("./abi")

const Home = () => {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [filteredCards, setFilteredCards] = useState([]);

    useEffect(() => {
        const fetchMemeTokens = async () => {
            try {
                // Tạo provider để kết nối với blockchain
                const provider = new ethers.JsonRpcProvider(process.env.REACT_APP_RPC_URL);
                console.log(provider);
                // Tạo contract instance
                const contract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS,abi,provider);
                // Gọi hàm getAllMemeTokens từ smart contract để hiển thị listedToken
                const memeTokens = await contract.getAllMemeTokens();

                //Xử lý dữ liệu và update State

                const mappedTokens = memeTokens.map(token => ({
                    name: token.name,
                    symbol: token.symbol,
                    description: token.description,
                    tokenImageUrl: token.tokenImageUrl,
                    fundingRaised: ethers.formatUnits(token.fundingRaised, 'ether'),
                    tokenAddress: token.tokenAddress,
                    creatorAddress: token.creatorAddress,
                })).filter(token => token.tokenAddress !== "0xfCab9Fd187e9764EAB7dC9bD4de284FE62397292");
                setCards(mappedTokens);
                setFilteredCards(mappedTokens);
            } catch (error) {
                console.error("Error fetching meme tokens:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMemeTokens();

    }, []);

    useEffect(() => {
      const lowerTerm = searchTerm.toLowerCase();
      if (searchTerm.trim() === "") {
        setFilteredCards(cards);
      } else {
        const results = cards.filter(card =>
          card.name.toLowerCase().includes(lowerTerm) ||
          card.symbol.toLowerCase().includes(lowerTerm) ||
          card.description.toLowerCase().includes(lowerTerm)
        );
        setFilteredCards(results);
      }
    }, [searchTerm, cards]);

    const navigateToTokenDetail = (card) => {
        // Sử dụng địa chỉ token để làm URL
        navigate(`/token-detail/${card.tokenAddress}`, {
            state: {card}
        });
    };

    return (
        <div className="app">

            <div className="card-container">
                {/* Button tạo Token mới */}
                <h3 className="start-new-coin" onClick={() => navigate('/token-create')}>
                    [start a new coin]
                </h3>
                <img src="https://pump.fun/_next/image?url=%2Fking-of-the-hill.png&w=256&q=75" alt="Start a new coin" className="start-new-image"/>
                
                {filteredCards.length > 0 && (
                    <div className="card main-card" onClick={() => navigateToTokenDetail(filteredCards[0])}>
                    <div className="card-content">
                        <img src={cards[0].tokenImageUrl} alt={cards[0].name} className="card-image"/>
                        <div className="card-text">
                        <h2>Created by {cards[0].creatorAddress}</h2>
                        <p>Funding Raised: {cards[0].fundingRaised} ETH</p>
                        <p>{cards[0].name} (ticker: {cards[0].symbol})</p>
                        <p>{cards[0].description}</p>
                        </div>
                    </div>
                    </div>
                )}

                {/* Thanh tìm kiếm */}
                <div className="search-container">
                    <input type="text" className="search-input" placeholder="search for tokens..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="card-list">
                    {(searchTerm ? filteredCards : cards.slice(0)).map((card, index) => (
                        <div key={index} className="card" onClick={() => navigateToTokenDetail(card)}>
                        <div className="card-content">
                            <img src={card.tokenImageUrl} alt={card.name} className="card-image"/>
                            <div className="card-text">
                            <h2>Created by {card.creatorAddress}</h2>
                            <p>Funding Raised: {card.fundingRaised} ETH</p>
                            <p>{card.name} (ticker: {card.symbol})</p>
                            <p>{card.description}</p>
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;