import logo from './logo.svg';
import './App.css';
import Main from './components/Main';
import { WalletProvider } from './components/WalletContext';

function App() {
  return (
    <WalletProvider>
      <div className="App">
        <Main />
      </div>
    </WalletProvider>
  );
}

export default App;
