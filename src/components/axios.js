import axios from "axios";

const instance = axios.create({
  baseURL: "https://www.abhidev.work.gd/",
});

export default instance;
