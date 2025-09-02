import { useEffect, useMemo } from "react";
import "./App.css";
import LoginForm from "./components/gui/login-form";

function App() {
  const token = useMemo(() => {
    let t = null;
    backend.onMain("token", (msg) => {
      console.log("Token received:", msg);
      t = msg;
    });
    return t;
  }, []);
  // const [nodeVersion, setNodeVersion] = useState<string | undefined>(undefined);

  // const updateNodeVersion = useCallback(
  //   async () =>
  //     setNodeVersion(await backend.nodeVersion("Hello from App.tsx!")),
  //   []
  // );

  useEffect(() => {
    backend.onMain("ws-message", (msg) => {
      console.log("WebSocket message received:", msg);
    });

    backend.onMain("print-job", (msg) => {
      console.log("Print job message received:", msg);
    });
  }, []);

  console.log(token);

  return (
    <div className="App">
      {/* snip... */}
      {token ? <></> : <LoginForm />}
      {/* snip... */}
    </div>
  );
}

export default App;
