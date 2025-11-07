import MainPage from "./components/MainPage"
import AuthPage from "./components/AuthPage"
import VerifyCode from "./components/VerifyCode"
import UserName from "./components/UserName";
import RefreshHandler from "./components/RefreshHandler";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RequestRegistration from "./components/RequestRegistration";

function App(){
  return(
    <Router>
        <Routes>
          <Route path="/auth" element={<MainPage />}></Route>
          <Route path="/" element={<Navigate to="/refresh" />} />
          <Route path="/refresh" element={<RefreshHandler />}></Route>
          <Route path="/auth/login" element={<AuthPage />}></Route>
          <Route path="/auth/start-register" element={<AuthPage />}></Route>
          <Route path="/auth/verify-phone" element={<VerifyCode />}></Route>
          <Route path="/auth/end-register" element={<UserName />}></Route>
          <Route path="/request" element={<RequestRegistration />}></Route>
        </Routes>
    </Router>
  );
}
export default App;