import { auth } from "@/lib/auth"
import { getUnreadNotificationCount, getUserNotifications } from "@/lib/notifications"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const encoder = new TextEncoder()
  
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      let intervalId: NodeJS.Timeout | null = null
      
      try {
        // Send initial notification count
        const initialCount = await getUnreadNotificationCount(session.user.id)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'count', count: initialCount })}\n\n`))
        
        // Send initial notifications
        const { notifications } = await getUserNotifications(session.user.id, {
          unreadOnly: true,
          limit: 5
        })
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'initial', notifications })}\n\n`))
        
        // Poll for new notifications every 10 seconds
        intervalId = setInterval(async () => {
          try {
            const count = await getUnreadNotificationCount(session.user.id)
            const { notifications } = await getUserNotifications(session.user.id, {
              unreadOnly: true,
              limit: 5
            })
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'update', count, notifications })}\n\n`))
          } catch (error) {
            console.error("Error polling for notifications:", error)
          }
        }, 10000) // Poll every 10 seconds
        
        // Handle client disconnect
        req.signal.addEventListener('abort', () => {
          if (intervalId) clearInterval(intervalId)
          controller.close()
        })
        
      } catch (error) {
        console.error("Error in notification stream:", error)
        if (intervalId) clearInterval(intervalId)
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}
