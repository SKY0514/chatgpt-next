import Pusher from "pusher";

// 서버(서버 액션)에서만 씁니다 — "이 대화방에 새 메시지/코멘트가 생겼다"는
// 이벤트를 publish하는 용도입니다. secret 키가 들어가므로 클라이언트에서
// import하면 안 됩니다 (lib/pusherClient.ts를 쓰세요).
const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export default pusherServer;
