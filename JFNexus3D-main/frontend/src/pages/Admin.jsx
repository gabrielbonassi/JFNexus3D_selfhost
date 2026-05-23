import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Trash2, RefreshCcw } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Admin = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`, {
        withCredentials: true,
      });

      setUsers(response.data);
    } catch (error) {
      toast.error("Erro ao carregar usuários");
    }
  };

  const renewUser = async (userId) => {
    try {
      const response = await axios.post(
        `${API}/admin/users/${userId}/renew`,
        {},
        { withCredentials: true }
      );

      setUsers((prev) =>
        prev.map((user) =>
          user.user_id === userId
            ? { ...user, expires_at: response.data.expires_at }
            : user
        )
      );

      toast.success("Acesso renovado +30 dias");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Erro ao renovar acesso");
    }
  };

  const deleteUser = async (userId, userName) => {
    const confirmDelete = window.confirm(
      `Deseja deletar o usuário ${userName}?`
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${API}/admin/users/${userId}`, {
        withCredentials: true,
      });

      setUsers((prev) => prev.filter((user) => user.user_id !== userId));
      toast.success("Usuário deletado");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Erro ao deletar usuário");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B061A] text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Painel Admin</h1>

      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user.user_id}
            className="bg-[#130A24] border border-[#281A45] rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-bold">{user.name}</p>

              <p className="text-sm text-gray-400">{user.email}</p>

              <p className="text-sm text-blue-400 mt-2">
                Expira em:{" "}
                {user.expires_at
                  ? new Date(user.expires_at).toLocaleDateString()
                  : "Sem expiração"}
              </p>

              <p className="text-xs text-gray-500 mt-1">{user.role}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => renewUser(user.user_id)}
                className="p-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-all"
                title="Renovar +30 dias"
              >
                <RefreshCcw className="h-5 w-5 text-blue-400" />
              </button>

              <button
                onClick={() => deleteUser(user.user_id, user.name)}
                className="p-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-all"
                title="Deletar usuário"
              >
                <Trash2 className="h-5 w-5 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;