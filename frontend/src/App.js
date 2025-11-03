import MainPage from "./components/MainPage"
import AuthPage from "./components/AuthPage"
import VerifyCode from "./components/VerifyCode"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RequestRegistration from "./components/RequestRegistration";

function App(){
  return(
    <Router>
        <Routes>
          <Route path="/" element={<MainPage />}></Route>
          <Route path="/auth/login" element={<AuthPage />}></Route>
          <Route path="/auth/start-register" element={<AuthPage />}></Route>
          <Route path="/auth/verify-phone" element={<VerifyCode />}></Route>
          <Route path="/request" element={<RequestRegistration />}></Route>
        </Routes>
    </Router>
  );
}
export default App;