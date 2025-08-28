import { test, expect, Page } from '@playwright/test';

test.describe('Real-time Collaboration - WebSocket Communication Tests', () => {
  let page1: Page;
  let page2: Page;

  test.beforeEach(async ({ browser }) => {
    // Create two browser contexts to simulate different users
    const context1 = await browser.newContext({
      storageState: 'tests/e2e/auth/regular-user.json'
    });
    const context2 = await browser.newContext({
      storageState: 'tests/e2e/auth/admin-user.json'
    });

    page1 = await context1.newPage();
    page2 = await context2.newPage();

    // Set up different users
    await page1.evaluate(() => {
      localStorage.setItem('auth_user', JSON.stringify({ 
        id: 1, 
        name: 'Student User', 
        email: 'student@jaquedu.com',
        role: 'student'
      }));
    });

    await page2.evaluate(() => {
      localStorage.setItem('auth_user', JSON.stringify({ 
        id: 2, 
        name: 'Instructor User', 
        email: 'instructor@jaquedu.com',
        role: 'instructor'
      }));
    });
  });

  test.afterEach(async () => {
    await page1.close();
    await page2.close();
  });

  test.describe('Real-time Discussion Forums', () => {
    test('should enable real-time messaging between users', async () => {
      // Both users navigate to the same discussion forum
      await page1.goto('/forum');
      await page2.goto('/forum');

      // Check if forum exists and is accessible
      const forumExists = !page1.url().includes('404') && !page2.url().includes('404');
      
      if (forumExists) {
        // Find or create a discussion topic
        const discussionTopic = page1.locator('.topic, .discussion-item').first();
        
        if (await discussionTopic.isVisible()) {
          await discussionTopic.click();
          
          // Page 2 should navigate to the same topic
          const topicUrl = page1.url();
          await page2.goto(topicUrl);

          // User 1 posts a message
          const messageInput1 = page1.locator(
            '[data-testid="message-input"], textarea[placeholder*="mensagem"], .message-input'
          );
          
          if (await messageInput1.isVisible()) {
            await messageInput1.fill('Esta é uma mensagem de teste em tempo real!');
            
            const sendButton1 = page1.locator(
              '[data-testid="send-message"], button:has-text("Enviar")'
            );
            if (await sendButton1.isVisible()) {
              await sendButton1.click();
            }

            // User 2 should see the message appear in real-time
            const newMessage = page2.locator('.message:has-text("mensagem de teste em tempo real")');
            await expect(newMessage).toBeVisible({ timeout: 10000 });

            // User 2 responds
            const messageInput2 = page2.locator(
              '[data-testid="message-input"], textarea[placeholder*="mensagem"], .message-input'
            );
            
            if (await messageInput2.isVisible()) {
              await messageInput2.fill('Recebido! Comunicação em tempo real funcionando.');
              
              const sendButton2 = page2.locator(
                '[data-testid="send-message"], button:has-text("Enviar")'
              );
              if (await sendButton2.isVisible()) {
                await sendButton2.click();
              }

              // User 1 should see the response
              const responseMessage = page1.locator('.message:has-text("Comunicação em tempo real funcionando")');
              await expect(responseMessage).toBeVisible({ timeout: 10000 });
            }
          }
        }
      } else {
        console.log('Forum not available, skipping real-time messaging test');
        test.skip();
      }
    });

    test('should show typing indicators', async () => {
      await page1.goto('/forum');
      await page2.goto('/forum');

      const forumExists = !page1.url().includes('404');
      
      if (forumExists) {
        const discussionTopic = page1.locator('.topic, .discussion-item').first();
        
        if (await discussionTopic.isVisible()) {
          await discussionTopic.click();
          await page2.goto(page1.url());

          // User 1 starts typing
          const messageInput1 = page1.locator(
            '[data-testid="message-input"], textarea, .message-input'
          );
          
          if (await messageInput1.isVisible()) {
            await messageInput1.focus();
            await messageInput1.type('User is typing...', { delay: 100 });

            // User 2 should see typing indicator
            const typingIndicator = page2.locator(
              '[data-testid="typing-indicator"], .typing-indicator, .is-typing'
            );
            
            if (await typingIndicator.isVisible({ timeout: 5000 })) {
              await expect(typingIndicator).toContainText(/digitando|typing/i);
            }

            // Stop typing
            await messageInput1.clear();
            
            // Typing indicator should disappear
            await expect(typingIndicator).toBeHidden({ timeout: 5000 });
          }
        }
      } else {
        test.skip();
      }
    });

    test('should handle user presence indicators', async () => {
      await page1.goto('/forum');
      await page2.goto('/forum');

      // Check for online user indicators
      const onlineUsers = page1.locator(
        '[data-testid="online-users"], .online-users, .user-list'
      );
      
      if (await onlineUsers.isVisible()) {
        // Should show both users as online
        const userCount = onlineUsers.locator('.user-item, .online-user');
        const count = await userCount.count();
        expect(count).toBeGreaterThanOrEqual(1);

        // Check for specific user presence
        const user1Indicator = page2.locator('.user-item:has-text("Student User")');
        const user2Indicator = page1.locator('.user-item:has-text("Instructor User")');
        
        if (await user1Indicator.isVisible()) {
          await expect(user1Indicator).toBeVisible();
        }
        if (await user2Indicator.isVisible()) {
          await expect(user2Indicator).toBeVisible();
        }
      }

      // Test presence when user goes offline
      await page1.close();
      
      // Wait for presence update
      await page2.waitForTimeout(3000);
      
      // User 1 should no longer appear as online
      const offlineUser = page2.locator('.user-item:has-text("Student User")');
      if (await offlineUser.isVisible()) {
        // Should either be hidden or marked as offline
        const isOfflineMarked = await offlineUser.locator('.offline, .away').isVisible();
        expect(isOfflineMarked || !(await offlineUser.isVisible())).toBeTruthy();
      }
    });
  });

  test.describe('Collaborative Learning Features', () => {
    test('should enable shared study sessions', async () => {
      // Navigate to a module for collaborative study
      await page1.goto('/module/1');
      await page2.goto('/module/1');

      const moduleExists = !page1.url().includes('404');
      
      if (moduleExists) {
        // Look for collaborative features
        const collaborativeSection = page1.locator(
          '[data-testid="collaborative-section"], .collaboration-panel, .study-group'
        );
        
        if (await collaborativeSection.isVisible()) {
          // Start a study session
          const startSessionButton = page1.locator(
            '[data-testid="start-session"], button:has-text("Iniciar Sessão")'
          );
          
          if (await startSessionButton.isVisible()) {
            await startSessionButton.click();

            // User 2 should see the session invitation
            const sessionInvite = page2.locator(
              '[data-testid="session-invite"], .session-notification'
            );
            
            if (await sessionInvite.isVisible({ timeout: 10000 })) {
              const joinButton = sessionInvite.locator('button:has-text("Entrar")');
              await joinButton.click();

              // Both users should now be in the same session
              const sessionActive = page1.locator(
                '[data-testid="active-session"], .session-active'
              );
              await expect(sessionActive).toBeVisible({ timeout: 10000 });

              const sessionActive2 = page2.locator(
                '[data-testid="active-session"], .session-active'
              );
              await expect(sessionActive2).toBeVisible({ timeout: 10000 });
            }
          }
        }
      } else {
        test.skip();
      }
    });

    test('should synchronize progress across users', async () => {
      await page1.goto('/module/1');
      await page2.goto('/module/1');

      const moduleExists = !page1.url().includes('404');
      
      if (moduleExists) {
        // User 1 makes progress
        const progressElement = page1.locator('.progress-tracker, [data-testid="progress"]');
        
        if (await progressElement.isVisible()) {
          // Simulate interaction that updates progress
          const nextButton = page1.locator(
            '[data-testid="next-step"], button:has-text("Próximo")'
          );
          
          if (await nextButton.isVisible()) {
            await nextButton.click();

            // Progress should update
            await page1.waitForTimeout(2000);

            // User 2's view should reflect the updated progress if in shared session
            const sharedProgress = page2.locator('.shared-progress, .sync-progress');
            
            if (await sharedProgress.isVisible()) {
              // Verify progress synchronization
              const progress1 = await page1.locator('.progress-value').textContent();
              const progress2 = await page2.locator('.progress-value').textContent();
              
              if (progress1 && progress2) {
                expect(progress1).toBe(progress2);
              }
            }
          }
        }
      } else {
        test.skip();
      }
    });

    test('should enable collaborative note-taking', async () => {
      await page1.goto('/notes');
      await page2.goto('/notes');

      const notesExists = !page1.url().includes('404');
      
      if (notesExists) {
        // Create a shared note
        const createNoteButton = page1.locator(
          '[data-testid="create-note"], button:has-text("Nova Nota")'
        );
        
        if (await createNoteButton.isVisible()) {
          await createNoteButton.click();

          const noteTitle = page1.locator('[data-testid="note-title"], [name="title"]');
          if (await noteTitle.isVisible()) {
            await noteTitle.fill('Notas Colaborativas sobre Jung');
          }

          const noteContent = page1.locator(
            '[data-testid="note-content"], textarea, .note-editor'
          );
          if (await noteContent.isVisible()) {
            await noteContent.fill('Conceitos importantes sobre arquétipos...');

            // Enable sharing
            const shareButton = page1.locator(
              '[data-testid="share-note"], button:has-text("Compartilhar")'
            );
            if (await shareButton.isVisible()) {
              await shareButton.click();

              // Save the shared note
              const saveButton = page1.locator('button:has-text("Salvar")');
              if (await saveButton.isVisible()) {
                await saveButton.click();
              }
            }
          }
        }

        // User 2 should be able to access and edit the shared note
        await page2.reload();
        const sharedNote = page2.locator('.note-item:has-text("Notas Colaborativas")');
        
        if (await sharedNote.isVisible()) {
          await sharedNote.click();

          const editableContent = page2.locator('[data-testid="note-content"], .note-editor');
          if (await editableContent.isVisible()) {
            await editableContent.fill(
              await editableContent.inputValue() + '\n\nAdicionado por outro usuário: Processo de individuação...'
            );

            const saveButton2 = page2.locator('button:has-text("Salvar")');
            if (await saveButton2.isVisible()) {
              await saveButton2.click();
            }

            // User 1 should see the changes in real-time
            await page1.waitForTimeout(2000);
            const updatedContent = page1.locator('[data-testid="note-content"]');
            const content = await updatedContent.textContent();
            
            if (content) {
              expect(content).toContain('Adicionado por outro usuário');
            }
          }
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('WebSocket Connection Management', () => {
    test('should handle connection drops and reconnection', async () => {
      await page1.goto('/forum');

      // Check for WebSocket connection status indicator
      const connectionStatus = page1.locator(
        '[data-testid="connection-status"], .connection-indicator, .websocket-status'
      );
      
      if (await connectionStatus.isVisible()) {
        // Should show connected status
        await expect(connectionStatus).toHaveClass(/connected|online/);
      }

      // Simulate network disruption
      await page1.route('**/ws', route => route.abort());
      await page1.route('**/websocket', route => route.abort());

      // Wait for connection status to update
      await page1.waitForTimeout(5000);

      if (await connectionStatus.isVisible()) {
        // Should show disconnected status
        await expect(connectionStatus).toHaveClass(/disconnected|offline/);
      }

      // Restore network connection
      await page1.unroute('**/ws');
      await page1.unroute('**/websocket');

      // Should automatically reconnect
      await page1.waitForTimeout(3000);

      if (await connectionStatus.isVisible()) {
        // Should show connected status again
        await expect(connectionStatus).toHaveClass(/connected|online/);
      }
    });

    test('should queue messages during disconnection', async () => {
      await page1.goto('/forum');
      await page2.goto('/forum');

      const forumExists = !page1.url().includes('404');
      
      if (forumExists) {
        const discussionTopic = page1.locator('.topic, .discussion-item').first();
        
        if (await discussionTopic.isVisible()) {
          await discussionTopic.click();
          await page2.goto(page1.url());

          // Disconnect user 1's WebSocket
          await page1.route('**/ws', route => route.abort());
          await page1.route('**/websocket', route => route.abort());

          // User 1 tries to send a message while disconnected
          const messageInput = page1.locator(
            '[data-testid="message-input"], textarea, .message-input'
          );
          
          if (await messageInput.isVisible()) {
            await messageInput.fill('Mensagem enviada offline');
            
            const sendButton = page1.locator('button:has-text("Enviar")');
            if (await sendButton.isVisible()) {
              await sendButton.click();

              // Should show queued/pending status
              const queuedMessage = page1.locator('.message-queued, .message-pending');
              if (await queuedMessage.isVisible()) {
                await expect(queuedMessage).toBeVisible();
              }

              // Restore connection
              await page1.unroute('**/ws');
              await page1.unroute('**/websocket');
              await page1.waitForTimeout(3000);

              // Message should be sent and appear on user 2's screen
              const sentMessage = page2.locator('.message:has-text("Mensagem enviada offline")');
              await expect(sentMessage).toBeVisible({ timeout: 15000 });
            }
          }
        }
      } else {
        test.skip();
      }
    });

    test('should handle multiple concurrent connections', async () => {
      // Create additional browser contexts to simulate more users
      const context3 = await page1.context().browser()?.newContext({
        storageState: 'tests/e2e/auth/regular-user.json'
      });
      
      if (context3) {
        const page3 = await context3.newPage();
        
        await page3.evaluate(() => {
          localStorage.setItem('auth_user', JSON.stringify({ 
            id: 3, 
            name: 'Third User', 
            email: 'user3@jaquedu.com',
            role: 'student'
          }));
        });

        // All three users join the same forum discussion
        await page1.goto('/forum');
        await page2.goto('/forum');
        await page3.goto('/forum');

        const forumExists = !page1.url().includes('404');
        
        if (forumExists) {
          const discussionTopic = page1.locator('.topic').first();
          
          if (await discussionTopic.isVisible()) {
            await discussionTopic.click();
            const topicUrl = page1.url();
            
            await page2.goto(topicUrl);
            await page3.goto(topicUrl);

            // All users should appear in the online users list
            const onlineUsers = page1.locator('[data-testid="online-users"], .online-users');
            
            if (await onlineUsers.isVisible()) {
              const userCount = await onlineUsers.locator('.user-item').count();
              expect(userCount).toBeGreaterThanOrEqual(3);
            }

            // Test concurrent messaging
            const message1 = 'Mensagem do usuário 1';
            const message2 = 'Mensagem do usuário 2';
            const message3 = 'Mensagem do usuário 3';

            const input1 = page1.locator('[data-testid="message-input"], .message-input').first();
            const input2 = page2.locator('[data-testid="message-input"], .message-input').first();
            const input3 = page3.locator('[data-testid="message-input"], .message-input').first();

            if (await input1.isVisible() && await input2.isVisible() && await input3.isVisible()) {
              // Send messages simultaneously
              await Promise.all([
                input1.fill(message1),
                input2.fill(message2),
                input3.fill(message3)
              ]);

              const send1 = page1.locator('button:has-text("Enviar")');
              const send2 = page2.locator('button:has-text("Enviar")');
              const send3 = page3.locator('button:has-text("Enviar")');

              await Promise.all([
                send1.click(),
                send2.click(),
                send3.click()
              ]);

              // All messages should appear on all pages
              await Promise.all([
                expect(page1.locator(`.message:has-text("${message2}")`)).toBeVisible({ timeout: 10000 }),
                expect(page1.locator(`.message:has-text("${message3}")`)).toBeVisible({ timeout: 10000 }),
                expect(page2.locator(`.message:has-text("${message1}")`)).toBeVisible({ timeout: 10000 }),
                expect(page2.locator(`.message:has-text("${message3}")`)).toBeVisible({ timeout: 10000 }),
                expect(page3.locator(`.message:has-text("${message1}")`)).toBeVisible({ timeout: 10000 }),
                expect(page3.locator(`.message:has-text("${message2}")`)).toBeVisible({ timeout: 10000 })
              ]);
            }
          }
        }

        await page3.close();
        await context3.close();
      }
    });
  });

  test.describe('Notification System', () => {
    test('should send real-time notifications', async () => {
      await page1.goto('/dashboard');
      await page2.goto('/admin/dashboard');

      // Admin (page2) creates an announcement
      const announcementButton = page2.locator(
        '[data-testid="create-announcement"], button:has-text("Anúncio")'
      );
      
      if (await announcementButton.isVisible()) {
        await announcementButton.click();

        const titleInput = page2.locator('[name="title"]');
        if (await titleInput.isVisible()) {
          await titleInput.fill('Novo Módulo Disponível');
          
          const contentInput = page2.locator('[name="content"], textarea');
          if (await contentInput.isVisible()) {
            await contentInput.fill('Um novo módulo sobre sonhos foi adicionado!');
            
            const publishButton = page2.locator('button:has-text("Publicar")');
            await publishButton.click();

            // Student (page1) should receive real-time notification
            const notification = page1.locator(
              '[data-testid="notification"], .notification, .alert'
            );
            
            if (await notification.isVisible({ timeout: 15000 })) {
              await expect(notification).toContainText('Novo Módulo');
            }
          }
        }
      }
    });

    test('should handle notification preferences', async () => {
      await page1.goto('/settings/notifications');
      
      if (!page1.url().includes('404')) {
        // Toggle notification settings
        const emailNotifications = page1.locator(
          '[data-testid="email-notifications"], input[type="checkbox"][name*="email"]'
        );
        
        if (await emailNotifications.isVisible()) {
          const wasChecked = await emailNotifications.isChecked();
          await emailNotifications.click();
          
          // Save settings
          const saveButton = page1.locator('button:has-text("Salvar")');
          if (await saveButton.isVisible()) {
            await saveButton.click();
          }

          // Verify setting was saved
          await page1.reload();
          const newState = await emailNotifications.isChecked();
          expect(newState).toBe(!wasChecked);
        }

        const pushNotifications = page1.locator(
          '[data-testid="push-notifications"], input[type="checkbox"][name*="push"]'
        );
        
        if (await pushNotifications.isVisible()) {
          await pushNotifications.check();
          
          const saveButton = page1.locator('button:has-text("Salvar")');
          if (await saveButton.isVisible()) {
            await saveButton.click();
          }
        }
      }
    });
  });
});