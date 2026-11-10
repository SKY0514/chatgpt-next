import PusherJs from "pusher-js";

// 클라이언트(브라우저)에서 구독용으로 씁니다. key/cluster는 공개돼도
// 괜찮은 값이라 NEXT_PUBLIC_ 접두사를 씁니다 (secret 키는 서버에만 있어요).
const pusherClient = new PusherJs(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

export default pusherClient;
