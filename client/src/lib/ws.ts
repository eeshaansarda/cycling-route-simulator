import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable, Subject } from 'rxjs';

interface SimulationMessage {
  type: string;
  payload?: any;
}

class WebSocketService {
  private socket$: WebSocketSubject<SimulationMessage>;
  private messageSubject$ = new Subject<SimulationMessage>();

  constructor() {
    this.socket$ = webSocket({
      url: `ws://localhost:3000/ws/simulate`,
      deserializer: e => JSON.parse(e.data),
      serializer: msg => JSON.stringify(msg),
      openObserver: {
        next: () => console.log('[WS] Connection opened')
      },
      closeObserver: {
        next: () => console.log('[WS] Connection closed')
      }
    });

    this.socket$.subscribe({
      next: msg => this.messageSubject$.next(msg),
      error: err => console.error('[WS] Error:', err),
      complete: () => console.log('[WS] Complete')
    });
  }

  public get messages$(): Observable<SimulationMessage> {
    return this.messageSubject$.asObservable();
  }

  public send(message: SimulationMessage): void {
    this.socket$.next(message);
  }

  public close(): void {
    this.socket$.complete();
  }
}

export const wsService = new WebSocketService();
