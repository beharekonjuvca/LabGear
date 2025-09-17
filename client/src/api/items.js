import api from "./axios";

const ItemsAPI = {
  listAllSimple() {
    return api
      .get("/items", { params: { page: 1, limit: 1000 } })
      .then((r) => r.data.data);
  },
};

export default ItemsAPI;
