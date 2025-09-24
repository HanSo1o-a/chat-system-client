// src/app/components/chat/chat.component.ts
import { Component, OnInit } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { PeerService } from '../services/peer.service';  
import { VideoChatService } from '../services/video-chat.service';  
import { GroupService } from '../services/group.service';
import { AuthService } from '../services/auth.service';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  imports: [FormsModule, CommonModule],
})

export class ChatComponent implements OnInit {
  channels: any[] = [];  // Channels fetched from back-end
  filteredChannels: any[] = [];  // Channels filtered by user role
  messages: any[] = [];  // Array of message objects
  currentChannel: any;  // Current channel
  message: string = '';
  newChannelName: string = '';
  newChannelDescription: string = '';
  private messageSubscription: any;  // For message subscription
  peerId: string = '';  // Current Peer ID, used for video chat
  localStream: any;
  remoteStream: any;
  groups: any[] = []; 
  userRole: string = ''; // User's role (admin, superadmin, user)
  messageText: string = '';
  selectedImage: File | null = null;  // Changed to File | null
  selectedVideo: File | null = null;  // Changed to File | null
  isInChannel: boolean = false;  // Check if user has joined the channel
  isInVideoChat: boolean = false;  // Whether the user is in a video chat
  videoChatStatusSubscription: any;
  newUsername: string = '';
  currentUsername :string = '';
  selectedGroupToExit: string = '';  // Store the selected group ID to exit

  constructor(
    private chatService: ChatService,
    private router: Router,
    private http: HttpClient,
    private peerService: PeerService,
    private videoChatService: VideoChatService,  // Inject VideoChatService
    private groupService: GroupService,
    private AuthService: AuthService
  ) {}

  ngOnInit() {
    this.userRole = this.chatService.getUserRole() || 'user'; 
    const username = localStorage.getItem('username') || 'Anonymous'; 
    this.currentUsername = username;
     this.loadGroups() 
      this.filterChannelsByRole();
 
  }

  ngOnDestroy() {
    this.peerService.closeConnection();
    if (this.videoChatStatusSubscription) {
      this.videoChatStatusSubscription.unsubscribe();
    }
  }

  filterChannelsByRole() {
      this.filteredChannels = this.channels;
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
            // Upload the peerId
            this.peerService.uploadPeerId(this.currentChannel);
            
            this.peerService
              .getPeerIdsInChannel(this.currentChannel._id)
              .then((peerIdsInRoom: string[]) => {
                // Exclude the current user's peerId
                const otherPeerIds = peerIdsInRoom.filter(
                  (peerId) => peerId !== this.peerService.peer.id
                );

                // Start video chat: establish connections with other peerIds
                otherPeerIds.forEach((peerId) => {
                  this.peerService.callPeer(peerId);
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
  
  loadGroups() {
    // 假设你有一个方法获取当前用户的 ID
    const getUsername = this.chatService.getUsername();
     console.log("getUsername:", getUsername);
   if ( this.userRole === 'superadmin')
   {
    this.groupService.getAllGroups().subscribe((groups: any[]) => {
      // 只保留包含当前用户的群组
      this.groups = groups;
      this.mergeChannelsFromGroups();
      console.log("Groups loaded:", this.groups);
   })}
   else
   {
    this.groupService.getAllGroups().subscribe((groups: any[]) => {
      // 只保留包含当前用户的群组
      this.groups = groups.filter(group => group.members.includes(getUsername) || group.admins.includes(getUsername));
      this.mergeChannelsFromGroups();
      console.log("Groups loaded:", this.groups);
    });
   }
  }
  mergeChannelsFromGroups() {
    // Initialize the channels array
    this.channels = [];
  
    // Loop through each group in the groups array
    this.groups.forEach(group => {
      // For each group, push its channels into the channels array
      if (group.channels && Array.isArray(group.channels)) {
        this.channels.push(...group.channels);
      }
    });
  
    // Log the merged channels
    console.log('Merged channels:', this.channels);
  }
  // Click to leave video chat
  leaveVideoChat() {
    if (this.isInVideoChat) {
      // Stop local video stream
      if (this.localStream) {
        // Explicitly declare track as MediaStreamTrack type
        this.localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }

      // Destroy the current Peer connection
      this.peerService.peer.destroy();

      // Set status as not in a video chat
      this.videoChatService.setVideoChatStatus(false);
      this.peerService.notifyServerUserLeft(this.currentChannel._id);
    }
  }

  createChannel() {
    if (this.newChannelName.trim() && this.newChannelDescription.trim()) {
      this.chatService.createChannel(this.newChannelName, this.newChannelDescription).subscribe((response) => {
        this.channels.push(response); // Add new channel to the list
        this.filterChannelsByRole();  // Re-filter the channels after creating a new one
        this.newChannelName = '';
        this.newChannelDescription = '';
      });
    } else {
      alert('Channel name and description are required!');
    }
  }

  joinChannel(channelId: string) {
    if (this.currentChannel && this.currentChannel.id === channelId) return;

    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe(); 
    }
   
    this.chatService.connect(channelId);
    this.currentChannel = this.channels.find(channel => channel.id === channelId);
    this.messages = [];  

    this.messageSubscription = this.chatService.receiveMessage().subscribe((message) => {
      this.messages.push(message);
    });
    this.isInChannel = true;
  }

  parseContent(content: string) {
    let imageUrl = '';
    let videoUrl = '';
    
    // Match image URL
    const imageMatch = content.match(/\[image:(.*?)\]/);
    if (imageMatch) {
      imageUrl = imageMatch[1]; // Extract image URL
    }
  
    // Match video URL
    const videoMatch = content.match(/\[video:(.*?)\]/);
    if (videoMatch) {
      videoUrl = videoMatch[1]; // Extract video URL
    }
  
    // Return processed content, and remove image/video URL parts
    const cleanedContent = content.replace(/\[image:(.*?)\]/, '').replace(/\[video:(.*?)\]/, '');
    return { content: cleanedContent, imageUrl, videoUrl };
  }

  sendMessage(message: { content: string; imageUrl?: string; videoUrl?: string;}) {
    if (message.content.trim() || message.imageUrl || message.videoUrl) {

      if (message.imageUrl) {
        message.content += ` [image:${message.imageUrl}]`;  // Append image URL
      }
  
      if (message.videoUrl) {
        message.content += ` [video:${message.videoUrl}]`;  // Append video URL
      }
      // Call chatService's sendMessage method with the callback
      this.chatService.sendMessage(this.currentChannel.id, message.content);
    }
    this.message = '';
  }

  // Image Upload Handler
  uploadImage() {
    const fileInput: HTMLInputElement | null = document.querySelector('#imageInput');
    if (fileInput) {
      fileInput.click();
    }
  }

  // Video Upload Handler
  uploadVideo() {
    const fileInput: HTMLInputElement | null = document.querySelector('#videoInput');
    if (fileInput) {
      fileInput.click();
    }
  }

  // Select Image for upload
  onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input && input.files?.length) {
      this.selectedImage = input.files[0];
      this.chatService.uploadImage(this.selectedImage).subscribe(response => {
        if (response.success) {
          this.addImageToMessage(response.fileUrl);
        } else {
          console.error('Image upload failed');
        }
      });
    }
  }

  // Select Video for upload
  onVideoSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input && input.files?.length) {
      this.selectedVideo = input.files[0];
      this.chatService.uploadVideo(this.selectedVideo).subscribe(response => {
        if (response.success) {
          this.addVideoToMessage(response.fileUrl);
        } else {
          console.error('Video upload failed');
        }
      });
    }
  }

  // Add Image to the Message
  addImageToMessage(imageUrl: string) {
    const newMessage = {
      username: 'current_user',
      content: 'Image message',
      imageUrl: 'http://localhost:3000' + imageUrl,
      videoUrl: undefined
    };

    // Call sendMessage to send the message
    this.sendMessage(newMessage);
    
    this.selectedImage = null;  // Clear selected image
  }

  // Add Video to the Message
  addVideoToMessage(videoUrl: string) {
    const newMessage = {
      username: 'current_user',
      content: 'Video message',
      imageUrl: undefined,
      videoUrl: 'http://localhost:3000' + videoUrl,
    };
    this.messages.push(newMessage);
    this.selectedVideo = null;  // Clear selected video
  }

  isAdminOrSuperAdmin(): boolean {
    return this.userRole === 'admin' || this.userRole === 'superadmin';
  }

  navigateToAdminPage() {
    this.router.navigate(['/admin']);
  }

  logout() {
    // Remove auth token and navigate to login page
    localStorage.removeItem('authToken');  // Clear the auth token
    this.router.navigate(['/login']);  // Redirect to the login page
  }

  changeUserId() {
  
    if (this.newUsername.trim()) {
      // Call the service to update the username
      this.AuthService.updateUsername(this.currentUsername, this.newUsername).subscribe(
        (response) => {
          if (response.success) {
            this.currentUsername = this.newUsername;  // Update the username
            this.newUsername = '';  // Clear the input field
            alert('Username updated successfully!');
            this.logout();
          } else {
            alert('Failed to update username');
          }
        },
        (error) => {
          console.error('Error updating username:', error);
        }
      );
    } else {
      alert('Please enter a new username');
    }
  }
// exitGroup method in the frontend component
exitGroup(groupId: string) {
  if (groupId) {
    // Assuming currentUsername contains the username or user ID of the logged-in user
    const username = this.currentUsername;  // Current username

    // Call the exitGroup method from the service
    this.AuthService.exitGroup(groupId, username).subscribe(
      (response) => {
        alert('Exited group successfully');
        // Update groups array to reflect that the user has exited the group
        this.loadGroups();
      },
      (error) => {
        alert('Error exiting the group');
        console.error(error);
      }
    );
  } else {
    alert('Please select a group to exit');
  }
}

}
