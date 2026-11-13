import { useAuth } from "./components/AuthContext.jsx";
import AuthForm from "./components/AuthForm.jsx";
import ProfilePicker from "./components/ProfilePicker.jsx";
import Browse from "./components/Browse.jsx";

// Step 1: log in.  Step 2: choose who is watching.  Step 3: browse.
export default function App() {
  const { user, profile } = useAuth();
  if (!user) return <AuthForm />;
  if (!profile) return <ProfilePicker />;
  return <Browse />;
}
