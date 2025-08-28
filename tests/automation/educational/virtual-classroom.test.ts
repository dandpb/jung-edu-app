/**
 * Virtual Classroom Session Automation Tests
 * 
 * Tests real-time collaboration features, live sessions, breakout rooms,
 * interactive whiteboards, and synchronous learning activities.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  VirtualClassroomService,
  SessionManagementService,
  BreakoutRoomService,
  WhiteboardService,
  ParticipationTrackingService,
  RecordingService
} from '../../../jung-edu-app/src/services/classroom';
import { WebRTCService } from '../../../jung-edu-app/src/services/webrtc';
import { SocketService } from '../../../jung-edu-app/src/services/socket';

// Mock WebRTC and Socket services for testing
jest.mock('../../../jung-edu-app/src/services/webrtc');
jest.mock('../../../jung-edu-app/src/services/socket');

interface VirtualSession {
  id: string;
  title: string;
  instructorId: string;
  courseId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  status: 'scheduled' | 'live' | 'paused' | 'ended' | 'cancelled';
  participants: Participant[];
  settings: SessionSettings;
  features: {
    chat: boolean;
    whiteboard: boolean;
    breakoutRooms: boolean;
    screenShare: boolean;
    recording: boolean;
    polls: boolean;
    handRaise: boolean;
  };
  metadata: {
    maxParticipants: number;
    isPublic: boolean;
    requiresApproval: boolean;
    allowsGuests: boolean;
  };
}

interface Participant {
  id: string;
  userId: string;
  role: 'instructor' | 'student' | 'ta' | 'observer';
  joinedAt: Date;
  leftAt?: Date;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  permissions: ParticipantPermissions;
  engagement: {
    handRaised: boolean;
    microphoneMuted: boolean;
    videoEnabled: boolean;
    chatMessages: number;
    whiteboardInteractions: number;
    pollParticipation: number;
  };
  technical: {
    bandwidth: number;
    latency: number;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    browser: string;
  };
}

interface ParticipantPermissions {
  canUnmuteSelf: boolean;
  canEnableVideo: boolean;
  canUseChat: boolean;
  canUseWhiteboard: boolean;
  canShareScreen: boolean;
  canCreateBreakoutRooms: boolean;
  canRecordSession: boolean;
}

interface SessionSettings {
  autoAdmit: boolean;
  mutedByDefault: boolean;
  videoOffByDefault: boolean;
  chatEnabled: boolean;
  privateChatEnabled: boolean;
  handRaiseEnabled: boolean;
  waitingRoomEnabled: boolean;
  sessionPassword?: string;
}

interface BreakoutRoom {
  id: string;
  sessionId: string;
  name: string;
  participants: string[];
  maxParticipants: number;
  createdAt: Date;
  duration: number; // minutes
  status: 'active' | 'closed';
  activity: {
    assignment?: string;
    sharedNotes: string;
    timeRemaining: number;
  };
}

interface WhiteboardElement {
  id: string;
  type: 'text' | 'drawing' | 'shape' | 'image' | 'sticky_note';
  position: { x: number; y: number };
  content: any;
  author: string;
  timestamp: Date;
  locked: boolean;
}

describe('Virtual Classroom Session Automation Tests', () => {
  let classroomService: VirtualClassroomService;
  let sessionService: SessionManagementService;
  let breakoutService: BreakoutRoomService;
  let whiteboardService: WhiteboardService;
  let participationService: ParticipationTrackingService;
  let recordingService: RecordingService;
  let webRTCService: jest.Mocked<WebRTCService>;
  let socketService: jest.Mocked<SocketService>;

  const mockSession: VirtualSession = {
    id: 'session123',
    title: 'Jung\'s Collective Unconscious - Live Discussion',
    instructorId: 'instructor456',
    courseId: 'jung-course',
    scheduledStart: new Date('2024-03-15T14:00:00Z'),
    scheduledEnd: new Date('2024-03-15T15:30:00Z'),
    status: 'scheduled',
    participants: [],
    settings: {
      autoAdmit: false,
      mutedByDefault: true,
      videoOffByDefault: false,
      chatEnabled: true,
      privateChatEnabled: false,
      handRaiseEnabled: true,
      waitingRoomEnabled: true
    },
    features: {
      chat: true,
      whiteboard: true,
      breakoutRooms: true,
      screenShare: true,
      recording: true,
      polls: true,
      handRaise: true
    },
    metadata: {
      maxParticipants: 30,
      isPublic: false,
      requiresApproval: true,
      allowsGuests: false
    }
  };

  beforeEach(() => {
    webRTCService = new WebRTCService() as jest.Mocked<WebRTCService>;
    socketService = new SocketService() as jest.Mocked<SocketService>;

    classroomService = new VirtualClassroomService(webRTCService, socketService);
    sessionService = new SessionManagementService();
    breakoutService = new BreakoutRoomService();
    whiteboardService = new WhiteboardService();
    participationService = new ParticipationTrackingService();
    recordingService = new RecordingService();

    jest.clearAllMocks();
  });

  describe('Session Management', () => {
    test('should create and configure virtual classroom session', async () => {
      const sessionConfig = {
        title: mockSession.title,
        instructorId: mockSession.instructorId,
        courseId: mockSession.courseId,
        scheduledStart: mockSession.scheduledStart,
        scheduledEnd: mockSession.scheduledEnd,
        settings: mockSession.settings,
        features: mockSession.features
      };

      const createdSession = await sessionService.createSession(sessionConfig);

      expect(createdSession.id).toMatch(/^session-[a-zA-Z0-9]+$/);
      expect(createdSession.status).toBe('scheduled');
      expect(createdSession.settings).toEqual(mockSession.settings);
      expect(createdSession.features).toEqual(mockSession.features);
      expect(createdSession.participants).toHaveLength(0);
    });

    test('should start session and admit participants', async () => {
      const session = await sessionService.createSession(mockSession);
      
      // Start the session
      const startedSession = await sessionService.startSession(session.id, mockSession.instructorId);
      
      expect(startedSession.status).toBe('live');
      expect(startedSession.actualStart).toBeDefined();
      
      // Add participants
      const participants = [
        { userId: 'student1', role: 'student' as const },
        { userId: 'student2', role: 'student' as const },
        { userId: 'ta1', role: 'ta' as const }
      ];

      for (const participant of participants) {
        await sessionService.addParticipant(session.id, participant);
      }

      const updatedSession = await sessionService.getSession(session.id);
      expect(updatedSession.participants).toHaveLength(3);
    });

    test('should handle waiting room functionality', async () => {
      const sessionWithWaitingRoom = {
        ...mockSession,
        settings: { ...mockSession.settings, waitingRoomEnabled: true }
      };

      const session = await sessionService.createSession(sessionWithWaitingRoom);
      await sessionService.startSession(session.id, mockSession.instructorId);

      // Student joins - should be placed in waiting room
      const joinRequest = await sessionService.requestJoin(session.id, 'student1');
      expect(joinRequest.status).toBe('waiting');
      expect(joinRequest.waitingRoomPosition).toBe(1);

      // Instructor admits student
      await sessionService.admitFromWaitingRoom(session.id, 'student1', mockSession.instructorId);
      
      const admittedParticipant = await sessionService.getParticipant(session.id, 'student1');
      expect(admittedParticipant.connectionStatus).toBe('connected');
    });

    test('should manage session capacity and overflow', async () => {
      const limitedSession = {
        ...mockSession,
        metadata: { ...mockSession.metadata, maxParticipants: 2 }
      };

      const session = await sessionService.createSession(limitedSession);
      await sessionService.startSession(session.id, mockSession.instructorId);

      // Add participants up to capacity
      await sessionService.addParticipant(session.id, { userId: 'student1', role: 'student' });
      await sessionService.addParticipant(session.id, { userId: 'student2', role: 'student' });

      // Attempt to add beyond capacity
      await expect(
        sessionService.addParticipant(session.id, { userId: 'student3', role: 'student' })
      ).rejects.toThrow('Session capacity exceeded');

      // Should create overflow/queue mechanism
      const queuePosition = await sessionService.addToQueue(session.id, 'student3');
      expect(queuePosition).toBe(1);
    });

    test('should handle session interruptions and reconnections', async () => {
      const session = await sessionService.createSession(mockSession);
      await sessionService.startSession(session.id, mockSession.instructorId);
      await sessionService.addParticipant(session.id, { userId: 'student1', role: 'student' });

      // Simulate network disruption
      await sessionService.handleConnectionLoss(session.id, 'student1');
      
      const participant = await sessionService.getParticipant(session.id, 'student1');
      expect(participant.connectionStatus).toBe('reconnecting');

      // Simulate reconnection
      await sessionService.handleReconnection(session.id, 'student1');
      
      const reconnectedParticipant = await sessionService.getParticipant(session.id, 'student1');
      expect(reconnectedParticipant.connectionStatus).toBe('connected');
    });
  });

  describe('Real-time Communication Features', () => {
    test('should handle audio/video controls', async () => {
      const session = await sessionService.createSession(mockSession);
      await sessionService.startSession(session.id, mockSession.instructorId);
      await sessionService.addParticipant(session.id, { userId: 'student1', role: 'student' });

      // Student unmutes themselves
      await classroomService.toggleMicrophone(session.id, 'student1', true);
      
      const participant = await sessionService.getParticipant(session.id, 'student1');
      expect(participant.engagement.microphoneMuted).toBe(false);

      // Instructor mutes all students
      await classroomService.muteAllParticipants(session.id, mockSession.instructorId);
      
      const updatedParticipant = await sessionService.getParticipant(session.id, 'student1');
      expect(updatedParticipant.engagement.microphoneMuted).toBe(true);
    });

    test('should manage chat functionality', async () => {
      const session = await sessionService.createSession(mockSession);
      await sessionService.startSession(session.id, mockSession.instructorId);
      await sessionService.addParticipant(session.id, { userId: 'student1', role: 'student' });

      // Send chat message
      const message = await classroomService.sendChatMessage(session.id, {
        senderId: 'student1',
        content: 'Great explanation about archetypes!',
        timestamp: new Date(),
        type: 'public'
      });

      expect(message.id).toBeDefined();
      expect(socketService.broadcast).toHaveBeenCalledWith(session.id, 'chat_message', message);

      // Private message to instructor
      const privateMessage = await classroomService.sendChatMessage(session.id, {
        senderId: 'student1',
        content: 'Could you clarify the shadow concept?',
        timestamp: new Date(),
        type: 'private',
        recipientId: mockSession.instructorId
      });

      expect(socketService.sendToUser).toHaveBeenCalledWith(
        mockSession.instructorId,
        'private_message',
        privateMessage
      );
    });

    test('should handle hand raising and participant interaction', async () => {
      const session = await sessionService.createSession(mockSession);
      await sessionService.startSession(session.id, mockSession.instructorId);
      await sessionService.addParticipant(session.id, { userId: 'student1', role: 'student' });

      // Student raises hand
      await classroomService.raiseHand(session.id, 'student1');
      
      const participant = await sessionService.getParticipant(session.id, 'student1');
      expect(participant.engagement.handRaised).toBe(true);

      // Instructor acknowledges
      await classroomService.acknowledgeHandRaise(session.id, 'student1', mockSession.instructorId);
      
      const acknowledgedParticipant = await sessionService.getParticipant(session.id, 'student1');
      expect(acknowledgedParticipant.engagement.handRaised).toBe(false);
    });

    test('should support screen sharing functionality', async () => {
      const session = await sessionService.createSession(mockSession);
      await sessionService.startSession(session.id, mockSession.instructorId);
      
      // Instructor starts screen sharing
      webRTCService.startScreenShare.mockResolvedValue({
        streamId: 'screen-stream-123',
        quality: 'high',
        frameRate: 30
      });

      const screenShare = await classroomService.startScreenShare(session.id, mockSession.instructorId);

      expect(screenShare.isActive).toBe(true);
      expect(screenShare.streamId).toBe('screen-stream-123');
      expect(webRTCService.startScreenShare).toHaveBeenCalledWith(mockSession.instructorId);
      
      // Notify all participants
      expect(socketService.broadcast).toHaveBeenCalledWith(
        session.id,
        'screen_share_started',
        expect.objectContaining({ streamId: 'screen-stream-123' })
      );
    });
  });

  describe('Breakout Room Management', () => {
    test('should create and manage breakout rooms', async () => {
      const session = await sessionService.createSession(mockSession);
      await sessionService.startSession(session.id, mockSession.instructorId);
      
      // Add participants
      const studentIds = ['student1', 'student2', 'student3', 'student4'];
      for (const studentId of studentIds) {
        await sessionService.addParticipant(session.id, { userId: studentId, role: 'student' });
      }

      // Create breakout rooms
      const breakoutRooms = await breakoutService.createBreakoutRooms(session.id, {
        numberOfRooms: 2,
        assignment: 'automatic', // or 'manual'
        duration: 15, // minutes
        activity: {
          assignment: 'Discuss the persona archetype and share personal insights',
          allowNotes: true
        }
      });

      expect(breakoutRooms).toHaveLength(2);
      expect(breakoutRooms[0].participants).toHaveLength(2);
      expect(breakoutRooms[1].participants).toHaveLength(2);
      expect(breakoutRooms[0].status).toBe('active');
    });

    test('should handle breakout room activities and monitoring', async () => {
      const breakoutRoom: BreakoutRoom = {
        id: 'breakout1',
        sessionId: mockSession.id,
        name: 'Archetype Discussion Group 1',
        participants: ['student1', 'student2'],
        maxParticipants: 3,
        createdAt: new Date(),
        duration: 15,
        status: 'active',
        activity: {
          assignment: 'Discuss persona vs shadow archetypes',
          sharedNotes: '',
          timeRemaining: 15
        }
      };

      // Students add to shared notes
      await breakoutService.updateSharedNotes(breakoutRoom.id, 'student1', 
        'Persona is our public face, what we show to the world.'
      );

      await breakoutService.updateSharedNotes(breakoutRoom.id, 'student2',
        'Shadow contains our repressed qualities and hidden aspects.'
      );

      const updatedRoom = await breakoutService.getBreakoutRoom(breakoutRoom.id);
      expect(updatedRoom.activity.sharedNotes).toContain('Persona is our public face');
      expect(updatedRoom.activity.sharedNotes).toContain('Shadow contains our repressed');

      // Instructor visits room (instructor monitoring)
      const visitResult = await breakoutService.visitRoom(breakoutRoom.id, mockSession.instructorId);
      expect(visitResult.canListen).toBe(true);
      expect(visitResult.participants).toHaveLength(2);
    });

    test('should handle breakout room closure and reporting', async () => {
      const breakoutRoomId = 'breakout1';
      
      // Time expires or instructor closes room
      const closureResult = await breakoutService.closeBreakoutRoom(breakoutRoomId, {
        reason: 'time_expired',
        collectNotes: true,
        returnToMainRoom: true
      });

      expect(closureResult.participantsReturned).toHaveLength(2);
      expect(closureResult.notesCollected).toBeDefined();
      expect(closureResult.summary).toContain('discussion');

      // Generate breakout summary
      const summary = await breakoutService.generateBreakoutSummary(mockSession.id);
      expect(summary.totalRooms).toBe(1);
      expect(summary.participationRate).toBe(1.0);
      expect(summary.insights).toBeDefined();
    });
  });

  describe('Interactive Whiteboard', () => {
    test('should create and manage collaborative whiteboard', async () => {
      const session = await sessionService.createSession(mockSession);
      await sessionService.startSession(session.id, mockSession.instructorId);

      // Initialize whiteboard
      const whiteboard = await whiteboardService.createWhiteboard(session.id);
      expect(whiteboard.id).toBeDefined();
      expect(whiteboard.elements).toHaveLength(0);

      // Instructor adds content
      const textElement = await whiteboardService.addElement(whiteboard.id, {
        type: 'text',
        position: { x: 100, y: 100 },
        content: { text: 'Jung\'s Four Functions', fontSize: 24, color: '#000' },
        author: mockSession.instructorId
      });

      expect(textElement.id).toBeDefined();
      expect(textElement.type).toBe('text');
      expect(socketService.broadcast).toHaveBeenCalledWith(
        session.id,
        'whiteboard_element_added',
        textElement
      );
    });

    test('should handle collaborative drawing and annotations', async () => {
      const whiteboardId = 'whiteboard123';
      
      // Multiple students contribute
      const drawingElement = await whiteboardService.addElement(whiteboardId, {
        type: 'drawing',
        position: { x: 200, y: 150 },
        content: { 
          path: 'M200,150 L300,200 L250,250 Z', 
          strokeColor: '#FF0000',
          strokeWidth: 3
        },
        author: 'student1'
      });

      const annotationElement = await whiteboardService.addElement(whiteboardId, {
        type: 'sticky_note',
        position: { x: 350, y: 180 },
        content: { 
          text: 'This represents the Self archetype',
          color: '#FFFF00',
          size: 'small'
        },
        author: 'student2'
      });

      expect(drawingElement.content.path).toBeDefined();
      expect(annotationElement.content.text).toContain('Self archetype');

      // Real-time collaboration
      expect(socketService.broadcast).toHaveBeenCalledTimes(2);
    });

    test('should support whiteboard templates and structured activities', async () => {
      const templateId = 'jung-archetypes-template';
      
      const templatedWhiteboard = await whiteboardService.createFromTemplate(
        mockSession.id,
        templateId,
        {
          title: 'Exploring Personal Archetypes',
          sections: [
            { name: 'Persona', position: { x: 100, y: 100 }, size: { width: 200, height: 150 } },
            { name: 'Shadow', position: { x: 350, y: 100 }, size: { width: 200, height: 150 } },
            { name: 'Anima/Animus', position: { x: 100, y: 300 }, size: { width: 200, height: 150 } },
            { name: 'Self', position: { x: 350, y: 300 }, size: { width: 200, height: 150 } }
          ]
        }
      );

      expect(templatedWhiteboard.elements).toHaveLength(4); // Pre-populated sections
      expect(templatedWhiteboard.template).toBe(templateId);
    });

    test('should export whiteboard content for review', async () => {
      const whiteboardId = 'whiteboard123';
      
      // Add some content first
      await whiteboardService.addElement(whiteboardId, {
        type: 'text',
        position: { x: 100, y: 50 },
        content: { text: 'Class Discussion Summary' },
        author: mockSession.instructorId
      });

      const exportResult = await whiteboardService.exportWhiteboard(whiteboardId, {
        format: 'pdf',
        includeAnnotations: true,
        includeAuthorInfo: true
      });

      expect(exportResult.downloadUrl).toBeDefined();
      expect(exportResult.format).toBe('pdf');
      expect(exportResult.fileSize).toBeGreaterThan(0);
    });
  });

  describe('Participation Tracking and Analytics', () => {
    test('should track comprehensive engagement metrics', async () => {
      const session = await sessionService.createSession(mockSession);
      await sessionService.startSession(session.id, mockSession.instructorId);
      
      const studentId = 'student1';
      await sessionService.addParticipant(session.id, { userId: studentId, role: 'student' });

      // Simulate various engagement activities
      await participationService.recordActivity(session.id, studentId, {
        type: 'chat_message',
        timestamp: new Date(),
        duration: 0,
        engagement_score: 0.8
      });

      await participationService.recordActivity(session.id, studentId, {
        type: 'whiteboard_interaction',
        timestamp: new Date(),
        duration: 30,
        engagement_score: 0.9
      });

      await participationService.recordActivity(session.id, studentId, {
        type: 'hand_raise',
        timestamp: new Date(),
        duration: 5,
        engagement_score: 0.7
      });

      const metrics = await participationService.getEngagementMetrics(session.id, studentId);

      expect(metrics.totalActivities).toBe(3);
      expect(metrics.averageEngagementScore).toBeCloseTo(0.8);
      expect(metrics.participationTypes).toEqual(['chat', 'whiteboard', 'verbal']);
      expect(metrics.overallRating).toBeOneOf(['low', 'medium', 'high']);
    });

    test('should generate real-time participation insights', async () => {
      const session = await sessionService.createSession(mockSession);
      await sessionService.startSession(session.id, mockSession.instructorId);
      
      // Add multiple participants
      const participantIds = ['student1', 'student2', 'student3'];
      for (const id of participantIds) {
        await sessionService.addParticipant(session.id, { userId: id, role: 'student' });
      }

      // Simulate different participation levels
      await participationService.recordActivity(session.id, 'student1', {
        type: 'multiple_activities',
        count: 10,
        engagement_score: 0.9
      });

      await participationService.recordActivity(session.id, 'student2', {
        type: 'few_activities',
        count: 3,
        engagement_score: 0.5
      });

      // student3 has no activities (passive participant)

      const insights = await participationService.generateRealTimeInsights(session.id);

      expect(insights.activeParticipants).toBe(2);
      expect(insights.passiveParticipants).toBe(1);
      expect(insights.averageEngagement).toBeGreaterThan(0);
      expect(insights.recommendations).toContain('Encourage student3 to participate');
      expect(insights.interventionNeeded).toBe(true);
    });

    test('should track session quality and technical metrics', async () => {
      const session = await sessionService.createSession(mockSession);
      await sessionService.startSession(session.id, mockSession.instructorId);

      const qualityMetrics = {
        audioQuality: 0.85,
        videoQuality: 0.78,
        connectionStability: 0.92,
        latencyAverage: 45, // ms
        bandwidthUtilization: 0.65,
        dropoutRate: 0.05
      };

      await participationService.recordTechnicalMetrics(session.id, qualityMetrics);

      const sessionQuality = await participationService.getSessionQuality(session.id);

      expect(sessionQuality.overallScore).toBeCloseTo(0.81);
      expect(sessionQuality.technicalIssues).toHaveLength(1); // Low video quality
      expect(sessionQuality.userExperienceRating).toBe('good');
    });

    test('should provide post-session analytics and reports', async () => {
      const session = await sessionService.createSession(mockSession);
      await sessionService.startSession(session.id, mockSession.instructorId);
      await sessionService.endSession(session.id);

      const sessionReport = await participationService.generateSessionReport(session.id);

      expect(sessionReport.duration).toBeDefined();
      expect(sessionReport.participantStats.totalParticipants).toBeGreaterThan(0);
      expect(sessionReport.engagementSummary).toBeDefined();
      expect(sessionReport.technicalSummary).toBeDefined();
      expect(sessionReport.contentCoverage).toBeDefined();
      expect(sessionReport.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('Session Recording and Playback', () => {
    test('should record session with multiple streams', async () => {
      const session = await sessionService.createSession(mockSession);
      await sessionService.startSession(session.id, mockSession.instructorId);

      // Start recording
      const recording = await recordingService.startRecording(session.id, {
        includeAudio: true,
        includeVideo: true,
        includeScreenShare: true,
        includeWhiteboard: true,
        includeChat: true,
        quality: 'high',
        format: 'mp4'
      });

      expect(recording.recordingId).toBeDefined();
      expect(recording.status).toBe('recording');
      expect(recording.streams).toContain('audio');
      expect(recording.streams).toContain('video');
      expect(recording.streams).toContain('whiteboard');

      // Stop recording
      const stoppedRecording = await recordingService.stopRecording(recording.recordingId);
      expect(stoppedRecording.status).toBe('processing');
    });

    test('should generate interactive playback with synchronized elements', async () => {
      const recordingId = 'recording123';
      
      const playbackData = await recordingService.generatePlayback(recordingId, {
        includeInteractiveElements: true,
        includeChatTranscript: true,
        includeParticipantList: true,
        generateChapters: true
      });

      expect(playbackData.videoUrl).toBeDefined();
      expect(playbackData.chapters).toHaveLength(3); // Auto-generated based on content
      expect(playbackData.synchronizedElements.chat).toBeDefined();
      expect(playbackData.synchronizedElements.whiteboard).toBeDefined();
      expect(playbackData.interactiveFeatures.searchable).toBe(true);
    });

    test('should support selective recording and privacy controls', async () => {
      const session = await sessionService.createSession({
        ...mockSession,
        settings: {
          ...mockSession.settings,
          recordingConsent: 'explicit' // Require individual consent
        }
      });

      await sessionService.startSession(session.id, mockSession.instructorId);

      // Request recording consent from participants
      const consentResults = await recordingService.requestRecordingConsent(session.id, {
        message: 'This session will be recorded for educational purposes. Do you consent?',
        timeout: 60 // seconds
      });

      expect(consentResults.responses).toBeDefined();
      expect(consentResults.consentGiven).toBeBoolean();
      
      // Only record consenting participants
      if (consentResults.consentGiven) {
        const selectiveRecording = await recordingService.startSelectiveRecording(session.id, {
          consentedParticipants: consentResults.consentedParticipants,
          blurNonConsenting: true
        });

        expect(selectiveRecording.participantIncluded).toBeDefined();
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle high-load scenarios gracefully', async () => {
      const largeSession = {
        ...mockSession,
        metadata: { ...mockSession.metadata, maxParticipants: 100 }
      };

      const session = await sessionService.createSession(largeSession);
      await sessionService.startSession(session.id, mockSession.instructorId);

      // Simulate many participants joining simultaneously
      const joinPromises = Array.from({ length: 50 }, (_, i) =>
        sessionService.addParticipant(session.id, { userId: `student${i}`, role: 'student' })
      );

      const results = await Promise.allSettled(joinPromises);
      const successful = results.filter(r => r.status === 'fulfilled');

      expect(successful.length).toBeGreaterThan(40); // Most should succeed
      expect(successful.length).toBeLessThanOrEqual(50); // None should exceed capacity

      // System should remain stable
      const sessionStatus = await sessionService.getSession(session.id);
      expect(sessionStatus.status).toBe('live');
    });

    test('should recover from instructor disconnection', async () => {
      const session = await sessionService.createSession(mockSession);
      await sessionService.startSession(session.id, mockSession.instructorId);
      
      // Add TA as backup
      await sessionService.addParticipant(session.id, { userId: 'ta1', role: 'ta' });

      // Simulate instructor disconnection
      await sessionService.handleConnectionLoss(session.id, mockSession.instructorId);

      // System should automatically promote TA or pause session
      const sessionAfterDisconnection = await sessionService.getSession(session.id);
      const taParticipant = sessionAfterDisconnection.participants.find(p => p.userId === 'ta1');

      expect(taParticipant?.permissions.canRecordSession).toBe(true);
      expect(sessionAfterDisconnection.status).toBeOneOf(['live', 'paused']);
    });

    test('should handle bandwidth limitations and adaptive quality', async () => {
      const session = await sessionService.createSession(mockSession);
      await sessionService.startSession(session.id, mockSession.instructorId);
      
      const lowBandwidthParticipant = {
        userId: 'student1',
        role: 'student' as const,
        technical: {
          bandwidth: 500, // kbps - very low
          connection: 'mobile'
        }
      };

      await sessionService.addParticipant(session.id, lowBandwidthParticipant);

      // System should automatically adjust quality
      const adaptiveSettings = await classroomService.getAdaptiveSettings(session.id, 'student1');

      expect(adaptiveSettings.videoQuality).toBe('low');
      expect(adaptiveSettings.audioQuality).toBe('standard');
      expect(adaptiveSettings.disableVideo).toBe(false); // Should still allow, but at low quality
      expect(adaptiveSettings.prioritizeAudio).toBe(true);
    });

    test('should maintain session state during temporary network issues', async () => {
      const session = await sessionService.createSession(mockSession);
      await sessionService.startSession(session.id, mockSession.instructorId);
      
      // Simulate network partition
      socketService.disconnect.mockImplementation(() => {
        // Simulate temporary disconnection
        setTimeout(() => socketService.reconnect(), 5000);
      });

      // Session should maintain state and attempt reconnection
      const stateBeforeIssue = await sessionService.getSession(session.id);
      
      await new Promise(resolve => setTimeout(resolve, 6000)); // Wait for reconnection
      
      const stateAfterRecovery = await sessionService.getSession(session.id);
      expect(stateAfterRecovery.status).toBe(stateBeforeIssue.status);
      expect(stateAfterRecovery.participants.length).toBe(stateBeforeIssue.participants.length);
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });
});

// Helper classes and interfaces for testing
interface SessionConfig {
  title: string;
  instructorId: string;
  courseId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  settings: SessionSettings;
  features: any;
}

interface JoinRequest {
  status: 'waiting' | 'admitted' | 'denied';
  waitingRoomPosition?: number;
}

interface ChatMessage {
  id?: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'public' | 'private';
  recipientId?: string;
}

interface ScreenShareResult {
  isActive: boolean;
  streamId: string;
}

interface RecordingConfig {
  includeAudio: boolean;
  includeVideo: boolean;
  includeScreenShare: boolean;
  includeWhiteboard: boolean;
  includeChat: boolean;
  quality: 'low' | 'medium' | 'high';
  format: string;
}

interface PlaybackData {
  videoUrl: string;
  chapters: Array<{ timestamp: number; title: string }>;
  synchronizedElements: {
    chat: any;
    whiteboard: any;
  };
  interactiveFeatures: {
    searchable: boolean;
  };
}

export { 
  SessionConfig, 
  JoinRequest, 
  ChatMessage, 
  ScreenShareResult, 
  RecordingConfig,
  PlaybackData 
};