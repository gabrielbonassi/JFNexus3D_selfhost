import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API}/auth/register`, form, {
        withCredentials: true,
      });

      toast.success("Conta criada com sucesso!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao criar conta");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B061A] flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-[#130A24] border border-[#281A45] rounded-2xl p-8 space-y-5">
        <h1 className="text-3xl font-bold text-white text-center">Criar conta</h1>

        <input
          type="text"
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full p-3 rounded-lg bg-[#0B061A] text-white border border-[#281A45]"
          required
        />

        <input
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full p-3 rounded-lg bg-[#0B061A] text-white border border-[#281A45]"
          required
        />

        <input
          type="password"
          placeholder="Senha"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full p-3 rounded-lg bg-[#0B061A] text-white border border-[#281A45]"
          required
        />

        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg">
          Criar conta
        </button>

        <p className="text-center text-gray-400">
          Já tem conta?{" "}
          <Link to="/login" className="text-blue-400">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;