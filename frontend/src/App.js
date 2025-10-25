import MainPage from "./components/MainPage"
import AuthPage from "./components/AuthPage"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App(){
  return(
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<MainPage />}></Route>
        </Routes>
        <Routes>
          <Route path="/auth/register" element={<AuthPage />}></Route>
        </Routes>
      </div>
    </Router>
  );
}
export default App;