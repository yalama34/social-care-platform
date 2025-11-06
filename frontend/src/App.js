import MainPage from "./components/MainPage"
import AuthPage from "./components/AuthPage"
import VerifyCode from "./components/VerifyCode"
import UserName from "./components/UserName";
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
<<<<<<< HEAD
          <Route path="/end-registrate" element={<UserName />}></Route>
=======
          <Route path="/request" element={<RequestRegistration />}></Route>
>>>>>>> 9d20f437a7515ec2e1d31635184d6c718ed062c7
        </Routes>
    </Router>
  );
}
export default App;