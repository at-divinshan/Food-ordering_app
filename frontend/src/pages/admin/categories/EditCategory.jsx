import { useParams } from "react-router-dom";
import { CategoryForm } from "./AddCategory";
export default function EditCategory() {
  const { id } = useParams();
  return <CategoryForm id={id} />;
}
