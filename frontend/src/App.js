import {
  BrowserRouter,
  Routes,
  Route 
} from "react-router-dom";
import Homepage from "./pages/Homepage.jsx";
import Registration from "./pages/Registration.jsx";
import Login from "./pages/Login.jsx";
import EventMgmt from "./pages/EventMgmt.jsx";
import VolunteerMatchingForm from "./pages/VolunteerMatchingForm.jsx";
import UserProfileMgmt from "./pages/UserProfileMgmt.jsx";
import VolunteerHistory from "./pages/VolunteerHistory.jsx";



function App() {
  return (
    <div className="App">
      <BrowserRouter>
       <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/login" element={<Login />} />
        <Route path="/userprofilemgmt" element={<UserProfileMgmt />} />
        <Route path="/eventmgmt" element={<EventMgmt />} />
        <Route path="/volunteermatchingform" element={<VolunteerMatchingForm />} />
        <Route path="/volunteerhistory" element={<VolunteerHistory />} />
       </Routes>
      </BrowserRouter>
   
    </div>
  );
}

export default App;
