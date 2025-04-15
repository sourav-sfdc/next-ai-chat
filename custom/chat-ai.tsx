'use client';

import * as React from 'react';
import { Bot, Send, User } from 'lucide-react';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const bedrockClient = new BedrockRuntimeClient({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
});

export function BedrockChat() {
    const [input, setInput] = React.useState('');
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user' as const, content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const command = new InvokeModelCommand({
                modelId: 'meta.llama3-3-70b-instruct-v1:0',
                body: JSON.stringify({
                    prompt: `\n\nHuman: ${input}\n\nAssistant:`,
                    max_gen_len: 512,
                    temperature: 0.5,
                    top_p: 0.9,                }),
                contentType: 'application/json',
                accept: 'application/json',
            });

            const response = await bedrockClient.send(command);
            const responseBody = new TextDecoder().decode(response.body);
            console.log(responseBody);
            const responseData = JSON.parse(responseBody);
            // Update this line to use generation instead of completion
            const assistantContent = responseData.generation || responseData.completion || 'No response';

            setMessages((prev) => [...prev, { role: 'assistant', content: assistantContent }]);
        } catch (error) {
            console.error('Error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Sorry, I encountered an error. Please try again.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <header className="py-6">
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    <Bot className="w-8 h-8 text-primary" />
                    Bedrock AI Chat
                </h1>
            </header>

            <Card className="min-h-[600px] flex flex-col">
                <div className="flex-1 p-4 overflow-y-auto">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={cn(
                                'flex gap-3 mb-4 p-4 rounded-lg',
                                message.role === 'assistant' && 'bg-muted'
                            )}
                        >
                            {message.role === 'assistant' ? (
                                <Bot className="w-6 h-6 text-primary flex-shrink-0" />
                            ) : (
                                <User className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                            )}
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                {message.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3 mb-4 bg-muted p-4 rounded-lg">
                            <Bot className="w-6 h-6 text-primary animate-pulse" />
                            <div className="animate-pulse">Thinking...</div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSubmit} className="border-t p-4">
                    <div className="flex gap-4">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Send
                        </Button>
                    </div>
                </form>
            </Card>
        </>
    );
}