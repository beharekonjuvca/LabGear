import api from "./axios";

const UserAPI = {
  me() {
    return api.get("/users/me").then((r) => r.data);
  },
  update(payload) {
    return api.patch("/users/me", payload).then((r) => r.data);
  },
};

export default UserAPI;
