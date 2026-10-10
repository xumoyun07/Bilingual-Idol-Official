// C1: /founder отдаёт ту же консоль основателя, что и /admin сегодня.
// Параметр ?tab= обрабатывается в Admin.tsx через useFounderNav (как раньше),
// параметр ?role= игнорируется. Настоящее разделение Admin.tsx на founder/admin
// произойдёт в C2; здесь маршрут только добавляется, /admin работает как раньше.
import Admin from "./Admin";

export default function Founder() {
  return <Admin />;
}