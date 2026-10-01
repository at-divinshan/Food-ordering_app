import { useParams } from "react-router-dom";
import { FoodForm } from "./AddFood";
export default function EditFood() {
  const { id } = useParams();
  return <FoodForm id={id} />;
}
