import { BrowserRouter, Routes, Route } from "react-router-dom"
import NavBar from "./components/NavBar/NavBar"
import HomeView from "./views/HomeView"
import LoginView from "./views/LoginView"
import RegisterView from "./views/RegisterView"
import BrowseView from "./views/BrowseView"
import ContactView from "./views/ContactView"
import CustomerView from "./views/CustomerView"
import MechanicsView from "./views/MechanicsView"
import AdminView from "./views/AdminView"

function App() {
  

  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/Login" element={<LoginView />} />
        <Route path="/Register" element={<RegisterView />} />
        <Route path="/Browse" element={<BrowseView />} />
        <Route path="/Contact" element={<ContactView />} />
        <Route path="/Customer" element={<CustomerView />} />
        <Route path="/Mechanic" element={<MechanicsView />} />
        <Route path="/Admin" element={<AdminView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

 
