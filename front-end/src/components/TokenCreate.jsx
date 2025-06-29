import React, { useState } from 'react';
import '../App.css'; 
import { useNavigate } from 'react-router-dom';
import { abi } from './abi'; 
import { ethers } from 'ethers';

const TokenCreate = () => {
    const [name, setName] = useState('');
    const navigate = useNavigate();
    const [ticker, setTicker] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const handleCreate = async () => {
        if (!name || !ticker || !imageUrl) {
            alert("Please fill in all fields.");
            return;
        }

        // Tạo provider và signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        console.log("Signer:", signer); 
        const contract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, abi, signer);
        // Tạo transaction create token
        const transaction = await contract.createMemeToken(name, ticker, description, imageUrl, {
            value: ethers.parseUnits("0.0001", 'ether'),
        });
        const receipt = await transaction.wait();

        alert(`Transaction successful! Hash: ${receipt.hash}`);

        console.log('Create token:', {name,ticker,description,imageUrl});
        navigate('/');
    }


    return (
        <div className="app">
            <div className="token-create-container">
                <h3 className="start-new-coin" onClick={() => navigate('/')}>[go back]</h3>
                <p className='info-text'>MemeCoin creation fee: 0.0001 ETH</p>
                <p className='info-text'>Max supply: 1 million tokens. Initial mint: 200k tokens.</p>
                <p className='info-text'>If funding target of 24 ETH is met, a liquidity pool will be created on Uniswap.</p>

                <div className='input-container'>
                    <input type="text" 
                        placeholder='Token name'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className='input-field' 
                    />
                    <input type="text" 
                        placeholder='Ticker symbol'
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value)}
                        className='input-field' 
                    />
                    <input type="text" 
                        placeholder='Description'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className='input-field' 
                    />
                    <input type="text" 
                        placeholder='Image URL'
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className='input-field' 
                    />
                    <button className='create-button' onClick={handleCreate}>Create Memecoin</button>
                </div>
            </div>
        </div>
    )
}

export default TokenCreate;