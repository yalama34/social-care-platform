import MainPage from "./components/MainPage"
import AuthPage from "./components/AuthPage"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App(){
  return(
    <Router>
        <Routes>
          <Route path="/" element={<MainPage />}></Route>
          <Route path="/auth/login" element={<AuthPage />}></Route>
          <Route path="/auth/start-register" element={<AuthPage />}></Route>
        </Routes>
    </Router>
  );
}
export default App;