import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PeerService } from '../services/peer.service';
import { VideoChatService } from '../services/video-chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  imports: [FormsModule, CommonModule],
})

export class ChatComponent implements OnInit, OnDestroy {
  groups: any[] = [];
  channels: any[] = [];
  messages: any[] = [];
  currentGroup: any = null;
  currentChannel: any = null;
  message: string = '';

  userRole: string = '';
  isInChannel: boolean = false;
  isInVideoChat: boolean = false;

  selectedImage: File | null = null;
  selectedVideo: File | null = null;

  remoteStreams: { peerId: string; stream: MediaStream }[] = [];

  private messageSubscription: Subscription | null = null;
  private videoChatStatusSubscription: Subscription | null = null;
  private remoteSub?: Subscription;

  constructor(
    private chatService: ChatService,
    private router: Router,
    private peerService: PeerService,
    private videoChatService: VideoChatService
  ) {}

  ngOnInit() {
    this.userRole = this.chatService.getUserRole() || 'user';

    // Get groups
    this.chatService.getGroups().subscribe((groups) => {
      this.groups = groups;
    });

    // Video chat status subscription
    this.videoChatStatusSubscription = this.videoChatService.videoChatStatus$.subscribe(
      (status) => (this.isInVideoChat = status)
    );

  }

  ngOnDestroy() {
    this.peerService.closeConnection();
    if (this.videoChatStatusSubscription) {
      this.videoChatStatusSubscription.unsubscribe();
    }
  }

  // Select group
  selectGroup(group: any) {
    this.currentGroup = group;
    this.currentChannel = null;
    this.messages = [];
  
    this.chatService.getGroupChannels(group._id).subscribe((channels) => {
      this.channels = channels;
    });
  
    // ✅ Dynamically update userRole to check if current user is an admin of this group
    const currentUserId = this.chatService.getUserId();
    if (group.admins.some((admin: any) => admin._id === currentUserId)) {
      this.userRole = 'admin';
    } else if (this.chatService.getUserRole() === 'superadmin') {
      this.userRole = 'superadmin';
    } else {
      this.userRole = 'user';
    }
  }
  

  // Select channel
  joinChannel(channel: any) {
    if (this.currentChannel && this.currentChannel._id === channel._id) return;

    this.messageSubscription?.unsubscribe();

    this.currentChannel = channel;
    this.messages = [];


    // Socket join channel
    this.chatService.connect(channel._id);

    this.messageSubscription = this.chatService.receiveMessage().subscribe((msg) => {
      this.messages.push(msg);
    });

    this.isInChannel = true;
  }

  leaveGroup(groupId: string) {
    this.chatService.leaveGroup(groupId).subscribe({
      next: (res) => {
        console.log('Left group:', res);
        this.currentGroup = null;
        this.channels = [];
        this.isInChannel = false;
        this.chatService.getGroups().subscribe((groups) => {
          this.groups = groups;
        });
      },
      error: (err) => console.error('Error leaving group:', err),
    });
  }

  // Admin leaves group admin rights
  leaveGroupAdmin(groupId: string) {
    this.chatService.leaveGroupAdmin(groupId).subscribe({
      next: (res) => {
        console.log('Left group as admin:', res);
        this.currentGroup = null;
        this.channels = [];
        this.isInChannel = false;
        this.chatService.getGroups().subscribe((groups) => {
          this.groups = groups;
        });

      },
      error: (err) => console.error('Error leaving group as admin:', err),
    });
  }

  // Send message
  sendMessage() {
    if (!this.message.trim() || !this.currentChannel) return;

    this.chatService.sendMessage(this.currentChannel._id, this.message);
    this.message = '';
  }

  uploadImage() {
    const fileInput: HTMLInputElement | null = document.querySelector('#imageInput');
    if (fileInput) fileInput.click();
  }

  uploadVideo() {
    const fileInput: HTMLInputElement | null = document.querySelector('#videoInput');
    if (fileInput) fileInput.click();
  }

  onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      this.selectedImage = input.files[0];
      this.chatService.uploadImage(this.selectedImage).subscribe((response) => {
        if (response.success) {
          this.sendMessageWithAttachment('Image message', 'http://localhost:3000' + response.fileUrl, null);
        }
      });
    }
  }

  onVideoSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      this.selectedVideo = input.files[0];
      this.chatService.uploadVideo(this.selectedVideo).subscribe((response) => {
        if (response.success) {
          this.sendMessageWithAttachment('Video message', null, 'http://localhost:3000' + response.fileUrl);
        }
      });
    }
  }

  private sendMessageWithAttachment(content: string, imageUrl?: string | null, videoUrl?: string | null) {
    if (!this.currentChannel) return;

    let finalContent = content;
    if (imageUrl) finalContent += ` [image:${imageUrl}]`;
    if (videoUrl) finalContent += ` [video:${videoUrl}]`;

    this.chatService.sendMessage(this.currentChannel._id, finalContent);
  }

  parseContent(content: string) {
    let imageUrl = '';
    let videoUrl = '';

    const imageMatch = content.match(/\[image:(.*?)\]/);
    if (imageMatch) imageUrl = imageMatch[1];

    const videoMatch = content.match(/\[video:(.*?)\]/);
    if (videoMatch) videoUrl = videoMatch[1];

    const cleanedContent = content.replace(/\[image:(.*?)\]/, '').replace(/\[video:(.*?)\]/, '');
    return { content: cleanedContent, imageUrl, videoUrl };
  }

  // Click to start video chat
  startVideoChat() {
    if (!this.isInVideoChat && this.isInChannel && this.currentChannel) {
      // Initialize Peer connection and wait for it to complete
      this.peerService.initializePeerConnection()
        .then(() => {
          // Set the status as in a video chat
          this.videoChatService.setVideoChatStatus(true);

          // After initialization, set up the local stream
          this.peerService.setupLocalMP4Stream().then(() => {
            this.peerService.uploadPeerId(this.currentChannel);

            this.peerService
            .getPeerIdsInChannel(this.currentChannel._id)
            .then((usersInRoom) => {
              const otherUsers = usersInRoom.filter(
                (u) => u.peerId !== this.peerService.peer.id
              );
    
              otherUsers.forEach((u) => {
                this.peerService.callPeer(u.peerId);
              });
            })
            .catch((error) => {
              console.error('Error fetching peer IDs:', error);
            });
          
          });
        })
        .catch((err) => {
          console.error('Error in video chat setup:', err);
        });
    } else {
      console.log('You must join a channel first to start a video chat.');
    }
  }

  leaveVideoChat() {
    if (this.isInVideoChat) {
      this.peerService.closeConnection();
      this.videoChatService.setVideoChatStatus(false);
      if (this.currentChannel) {
        this.peerService.notifyServerUserLeft(this.currentChannel._id);
      }
    }
  }

  isAdminOrSuperAdmin(): boolean {
    return this.userRole === 'admin' || this.userRole === 'superadmin';
  }

  navigateToAdminPage() {
    this.router.navigate(['/admin']);
  }

  attachStream(videoEl: HTMLVideoElement, stream: MediaStream) {
    videoEl.srcObject = stream;
  }
}
