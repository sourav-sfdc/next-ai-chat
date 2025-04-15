import {BedrockChat} from "@/custom/chat-ai";

export default function Home() {
  return (
      <div className="min-h-screen bg-muted/10">
        <div className="max-w-4xl mx-auto p-4">
          <BedrockChat/>
        </div>
      </div>
  );
}
