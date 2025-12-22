// import API from "./axios";
import API from "../../api/axios";
export async function updateEBookProgress(payload) {
  return API.put("/student/ebooks/progress", payload);
}
