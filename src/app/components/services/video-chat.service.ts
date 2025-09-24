// src/app/services/video-chat.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VideoChatService {
  // Use BehaviorSubject to share the video chat status
  private videoChatStatusSubject = new BehaviorSubject<boolean>(false);
  videoChatStatus$ = this.videoChatStatusSubject.asObservable();

  constructor() {}

  // Set video chat status
  setVideoChatStatus(status: boolean) {
    this.videoChatStatusSubject.next(status);
  }
}
