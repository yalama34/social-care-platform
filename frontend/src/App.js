import MainPage from "./components/MainPage"
import AuthPage from "./components/AuthPage"
import VerifyCode from "./components/VerifyCode"
import UserName from "./components/UserName";
import RefreshHandler from "./components/RefreshHandler";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RequestRegistration from "./components/RequestRegistration";
import HomePage from "./components/HomePage";
import Profile from "./components/Profile";
import RequestFeed from "./components/RequestFeed";
import AdminPanel from "./components/AdminPanel";

function App(){
  return(
    <Router>
        <RefreshHandler />
        <Routes>
          <Route path="/auth" element={<MainPage />}></Route>
          <Route path="/" element={<Navigate to="/auth" />} />
          <Route path="/auth/login-start" element={<AuthPage />}></Route>
          <Route path="/auth/start-register" element={<AuthPage />}></Route>
          <Route path="/auth/verify-email" element={<VerifyCode />}></Route>
          <Route path="/auth/end-register" element={<UserName />}></Route>
          <Route path="/request" element={<RequestRegistration />}></Route>
          <Route path="/home/*" element={<HomePage />}></Route>
          <Route path="/request-feed" element={<RequestFeed />}></Route>
          <Route path="/profile/:user_id" element={<Profile />}></Route>
          <Route path="/admin" element={<AdminPanel />}></Route> 
        </Routes>
    </Router>
  );
}
export default App;