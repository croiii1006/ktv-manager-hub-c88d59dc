import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) {
      navigate("/dashboard");
    } else {
      alert("账号或密码错误（admin / 123456）");
    }
  };

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>登录系统</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
        <input
          placeholder="用户名：admin"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <br /><br />
        <input
          type="password"
          placeholder="密码：123456"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br /><br />
        <button type="submit">登录</button>
      </form>
    </div>
  );
}
