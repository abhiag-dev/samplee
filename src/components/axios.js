import axios from "axios";

const instance = axios.create({
  baseURL: "http://3.110.56.98:3000",
});

export default instance;
