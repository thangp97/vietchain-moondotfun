import {BrowserRouter, Routes, Route} from 'react-router-dom'
import React from 'react'
import Home from './Home'
import TokenDetail from './TokenDetail.jsx'
import TokenCreate from './TokenCreate.jsx'

import HowItWorks from './HowItWorks.jsx'
import NavBar from './NavBar.jsx'


const Main = () => {
    return (
        <BrowserRouter>
            <NavBar/>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/token-detail/:tokenAddress" element={<TokenDetail/>} />
                <Route path="/token-create" element={<TokenCreate/>} />
                <Route path="/how-it-works" element={<HowItWorks />} />
            </Routes>
        </BrowserRouter>
    )
}

export default Main