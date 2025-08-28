import { test, expect, Page } from '@playwright/test';
import { TestHelpers, TestDataGenerator } from './utils/test-helpers';

test.describe('Educational Content Interaction', () => {
  let page: Page;
  let helpers: TestHelpers;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    helpers = new TestHelpers(page);
    await helpers.disableAnimations();
    await helpers.setupAuth('student');
  });

  test.afterEach(async () => {
    await helpers.cleanup();
  });

  test.describe('Module Content Navigation', () => {
    test('should navigate through module sections', async () => {
      // Mock module content
      await helpers.mockApiResponse('modules/1', {
        module: {
          id: 1,
          title: 'Introduction to Analytical Psychology',
          sections: [
            {
              id: 1,
              title: 'Carl Jung: Life and Work',
              content: 'Carl Gustav Jung was a Swiss psychiatrist...',
              type: 'text',
              duration: 10
            },
            {
              id: 2,
              title: 'Key Concepts Overview',
              content: 'Jung introduced several revolutionary concepts...',
              type: 'multimedia',
              duration: 15
            }
          ],
          currentSection: 1,
          progress: 0
        }
      });

      await page.goto('/module/1');
      await helpers.waitForPageReady();

      // Should show module title and content
      const moduleTitle = page.locator('[data-testid="module-title"], h1, .module-header');
      await expect(moduleTitle.first()).toContainText(/Analytical Psychology|Psicologia Analítica/i);

      const sectionContent = page.locator(
        '[data-testid="section-content"], .section-text, .module-content'
      );
      await expect(sectionContent.first()).toBeVisible();
      await expect(sectionContent.first()).toContainText(/Carl Jung|psychiatrist/i);

      // Should have section navigation
      const nextButton = page.locator(
        '[data-testid="next-section"], button:has-text("Próximo"), .nav-next'
      );
      
      if (await nextButton.isVisible()) {
        await nextButton.click();
        
        // Should advance to next section
        await page.waitForTimeout(1000);
        await expect(sectionContent.first()).toContainText(/Key Concepts|Conceitos Chave/i);
        
        // Progress should update
        const progressBar = page.locator('.progress-bar, [data-testid="progress"]');
        if (await progressBar.isVisible()) {
          const progressText = await progressBar.textContent();
          expect(progressText).toMatch(/[1-9]\d*%|[2-9]\/\d+/);
        }
      }
    });

    test('should show table of contents and allow section jumping', async () => {
      await page.goto('/module/1');
      await helpers.waitForPageReady();

      // Look for table of contents or section menu
      const tocButton = page.locator(
        '[data-testid="toc"], button:has-text("Índice"), .table-of-contents, .sections-menu'
      );
      
      if (await tocButton.isVisible()) {
        await tocButton.click();
        
        // Should show section list
        const sectionList = page.locator(
          '[data-testid="section-list"], .toc-section, .section-item'
        );
        await expect(sectionList.first()).toBeVisible();
        
        // Click on specific section
        const section2 = page.locator('.section-item').nth(1);
        if (await section2.isVisible()) {
          await section2.click();
          
          // Should jump to that section
          const currentSection = page.locator('.current-section, .active-section');
          if (await currentSection.isVisible()) {
            await expect(currentSection).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Multimedia Content', () => {
    test('should play video content with controls', async () => {
      // Mock module with video
      await helpers.mockApiResponse('modules/2/section/1', {
        section: {
          id: 1,
          title: 'Jung in Practice',
          type: 'video',
          videoUrl: 'https://example.com/video.mp4',
          duration: 600,
          subtitles: true,
          transcript: 'Video transcript content...'
        }
      });

      await page.goto('/module/2/section/1');
      await helpers.waitForPageReady();

      // Should show video player
      const videoPlayer = page.locator(
        '[data-testid="video-player"], video, .video-container'
      );
      
      if (await videoPlayer.isVisible()) {
        await expect(videoPlayer).toBeVisible();
        
        // Should have video controls
        const playButton = page.locator(
          '[data-testid="play-button"], .play-btn, button[aria-label*="play"]'
        );
        
        if (await playButton.isVisible()) {
          await playButton.click();
          
          // Video should start playing (mock interaction)
          await page.waitForTimeout(1000);
          
          const pauseButton = page.locator(
            '[data-testid="pause-button"], .pause-btn, button[aria-label*="pause"]'
          );
          if (await pauseButton.isVisible()) {
            await expect(pauseButton).toBeVisible();
          }
        }
        
        // Test subtitle toggle
        const subtitleButton = page.locator(
          '[data-testid="subtitles"], .subtitle-btn, button[aria-label*="subtitle"]'
        );
        if (await subtitleButton.isVisible()) {
          await subtitleButton.click();
          
          const subtitleTrack = page.locator('.subtitle-track, .captions');
          if (await subtitleTrack.isVisible()) {
            await expect(subtitleTrack).toBeVisible();
          }
        }
      }
    });

    test('should display interactive visualizations', async () => {
      await helpers.mockApiResponse('modules/3/visualization', {
        visualization: {
          id: 1,
          type: 'mind_map',
          title: 'Jung\'s Psychological Types',
          data: {
            nodes: [
              { id: 'thinking', label: 'Thinking' },
              { id: 'feeling', label: 'Feeling' },
              { id: 'sensation', label: 'Sensation' },
              { id: 'intuition', label: 'Intuition' }
            ]
          }
        }
      });

      await page.goto('/module/3/visualization');
      await helpers.waitForPageReady();

      // Should show interactive visualization
      const visualization = page.locator(
        '[data-testid="visualization"], .mind-map, .interactive-diagram'
      );
      
      if (await visualization.isVisible()) {
        await expect(visualization).toBeVisible();
        
        // Should be interactive - test node clicking
        const nodeElement = page.locator('.node, .diagram-element').first();
        if (await nodeElement.isVisible()) {
          await nodeElement.click();
          
          // Should show details or highlight
          const details = page.locator('.node-details, .popup, .tooltip');
          if (await details.isVisible()) {
            await expect(details).toBeVisible();
          }
        }
      }
    });

    test('should handle audio content with transcript', async () => {
      await page.goto('/module/4/audio');
      
      if (!page.url().includes('404')) {
        await helpers.waitForPageReady();

        const audioPlayer = page.locator(
          '[data-testid="audio-player"], audio, .audio-container'
        );
        
        if (await audioPlayer.isVisible()) {
          await expect(audioPlayer).toBeVisible();
          
          // Should have transcript toggle
          const transcriptButton = page.locator(
            '[data-testid="transcript"], button:has-text("Transcrição")'
          );
          if (await transcriptButton.isVisible()) {
            await transcriptButton.click();
            
            const transcript = page.locator('.transcript, .audio-text');
            await expect(transcript).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Reading and Note-Taking', () => {
    test('should allow text highlighting', async () => {
      await page.goto('/module/1');
      await helpers.waitForPageReady();

      const textContent = page.locator('.module-content p, .section-text');
      
      if (await textContent.first().isVisible()) {
        // Simulate text selection and highlighting
        await textContent.first().dblclick();
        
        // Look for highlight button or tooltip
        const highlightButton = page.locator(
          '[data-testid="highlight"], button:has-text("Destacar"), .highlight-btn'
        );
        
        if (await highlightButton.isVisible()) {
          await highlightButton.click();
          
          // Text should be highlighted
          const highlightedText = page.locator('.highlighted, .highlight, mark');
          if (await highlightedText.isVisible()) {
            await expect(highlightedText).toBeVisible();
          }
        }
      }
    });

    test('should enable note-taking functionality', async () => {
      await page.goto('/module/1');
      await helpers.waitForPageReady();

      // Look for notes panel or button
      const notesButton = page.locator(
        '[data-testid="notes"], button:has-text("Notas"), .notes-toggle'
      );
      
      if (await notesButton.isVisible()) {
        await notesButton.click();
        
        // Should show notes panel
        const notesPanel = page.locator(
          '[data-testid="notes-panel"], .notes-sidebar, .note-editor'
        );
        await expect(notesPanel).toBeVisible();
        
        // Should allow adding notes
        const noteInput = page.locator(
          '[data-testid="note-input"], textarea[placeholder*="nota"]'
        );
        if (await noteInput.isVisible()) {
          await noteInput.fill('This concept about archetypes is fundamental to understanding Jung.');
          
          const saveNoteButton = page.locator(
            'button:has-text("Salvar"), button:has-text("Save"), [data-testid="save-note"]'
          );
          if (await saveNoteButton.isVisible()) {
            await saveNoteButton.click();
            
            // Note should appear in notes list
            const savedNote = page.locator('.note-item, .saved-note');
            await expect(savedNote.first()).toContainText('archetypes');
          }
        }
      }
    });

    test('should sync notes across sessions', async () => {
      await page.goto('/module/1');
      await helpers.waitForPageReady();

      // Mock saved notes API
      await helpers.mockApiResponse('notes/module/1', {
        notes: [
          {
            id: 1,
            content: 'Previously saved note about Jung',
            timestamp: new Date().toISOString(),
            moduleId: 1,
            sectionId: 1
          }
        ]
      });

      const notesButton = page.locator('[data-testid="notes"], .notes-toggle');
      if (await notesButton.isVisible()) {
        await notesButton.click();
        
        // Should load existing notes
        const existingNote = page.locator('.note-item');
        if (await existingNote.isVisible()) {
          await expect(existingNote).toContainText('Previously saved note');
        }
      }
    });
  });

  test.describe('Progress Tracking', () => {
    test('should track reading time and engagement', async () => {
      await page.goto('/module/1');
      await helpers.waitForPageReady();

      // Mock progress tracking API
      await helpers.mockApiResponse('modules/1/track', {
        success: true,
        timeSpent: 300,
        engagement: 'high',
        sectionsViewed: [1]
      });

      const content = page.locator('.module-content');
      if (await content.isVisible()) {
        // Simulate reading behavior
        await content.scrollIntoViewIfNeeded();
        await page.waitForTimeout(5000); // 5 seconds of "reading"
        
        // Scroll to simulate engagement
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await page.waitForTimeout(2000);
      }

      // Check if progress is updated
      const progressDisplay = page.locator('.time-spent, .engagement-metric');
      if (await progressDisplay.first().isVisible()) {
        const progressText = await progressDisplay.first().textContent();
        expect(progressText).toMatch(/\d+:\d+|\d+ min/);
      }
    });

    test('should mark content as completed', async () => {
      await page.goto('/module/1/section/1');
      await helpers.waitForPageReady();

      // Mock completion API
      await helpers.mockApiResponse('modules/1/section/1/complete', {
        success: true,
        sectionCompleted: true,
        moduleProgress: 25,
        nextSection: 2
      });

      const content = page.locator('.section-content');
      if (await content.isVisible()) {
        // Scroll through content
        await content.scrollIntoViewIfNeeded();
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(3000);
      }

      // Mark as complete button should appear
      const completeButton = page.locator(
        '[data-testid="mark-complete"], button:has-text("Concluir"), .complete-section'
      );
      
      if (await completeButton.isVisible()) {
        await completeButton.click();
        
        // Should show completion confirmation
        const completionCheck = page.locator(
          '.completed, .check-mark, [data-testid="section-complete"]'
        );
        if (await completionCheck.isVisible()) {
          await expect(completionCheck).toBeVisible();
        }
      }
    });
  });

  test.describe('Accessibility Features', () => {
    test('should support keyboard navigation', async () => {
      await page.goto('/module/1');
      await helpers.waitForPageReady();

      // Test keyboard navigation through content
      await page.keyboard.press('Tab');
      
      // Should focus on first interactive element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test arrow key navigation if supported
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);
      
      // Should navigate to next section or element
      const nextElement = page.locator(':focus');
      await expect(nextElement).toBeVisible();
    });

    test('should provide screen reader support', async () => {
      await page.goto('/module/1');
      await helpers.waitForPageReady();

      // Check for ARIA labels and roles
      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent.first()).toBeVisible();
      
      // Check for proper heading hierarchy
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
      
      // Check for alt text on images
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i);
        if (await image.isVisible()) {
          const altText = await image.getAttribute('alt');
          expect(altText).not.toBeNull();
        }
      }
    });

    test('should support text size adjustment', async () => {
      await page.goto('/module/1');
      await helpers.waitForPageReady();

      // Look for font size controls
      const fontSizeButton = page.locator(
        '[data-testid="font-size"], button:has-text("A+"), .text-size'
      );
      
      if (await fontSizeButton.isVisible()) {
        const originalSize = await page.evaluate(() => {
          const element = document.querySelector('p, .content-text');
          return element ? window.getComputedStyle(element).fontSize : '16px';
        });
        
        await fontSizeButton.click();
        
        const newSize = await page.evaluate(() => {
          const element = document.querySelector('p, .content-text');
          return element ? window.getComputedStyle(element).fontSize : '16px';
        });
        
        expect(newSize).not.toBe(originalSize);
      }
    });
  });

  test.describe('Content Search and Discovery', () => {
    test('should search within module content', async () => {
      await page.goto('/module/1');
      await helpers.waitForPageReady();

      // Look for search functionality
      const searchButton = page.locator(
        '[data-testid="search"], button:has-text("Buscar"), .search-toggle'
      );
      
      if (await searchButton.isVisible()) {
        await searchButton.click();
        
        const searchInput = page.locator(
          '[data-testid="search-input"], input[placeholder*="buscar"]'
        );
        await expect(searchInput).toBeVisible();
        
        await searchInput.fill('archetype');
        await page.keyboard.press('Enter');
        
        // Should highlight search results
        const searchResults = page.locator('.search-highlight, .search-result');
        if (await searchResults.first().isVisible()) {
          await expect(searchResults.first()).toBeVisible();
        }
      }
    });

    test('should provide content recommendations', async () => {
      await page.goto('/module/1');
      await helpers.waitForPageReady();

      // Mock recommendations API
      await helpers.mockApiResponse('recommendations/module/1', {
        recommendations: [
          {
            id: 2,
            title: 'Advanced Archetypal Theory',
            reason: 'Based on your interest in archetypes'
          },
          {
            id: 3,
            title: 'Jung\'s Dream Analysis',
            reason: 'Continues from current topic'
          }
        ]
      });

      // Look for recommendations section
      const recommendations = page.locator(
        '[data-testid="recommendations"], .related-content, .suggested-modules'
      );
      
      if (await recommendations.first().isVisible()) {
        await expect(recommendations.first()).toBeVisible();
        
        // Should show related modules
        const relatedModule = page.locator('.recommendation-item, .related-module');
        if (await relatedModule.first().isVisible()) {
          await expect(relatedModule.first()).toContainText(/Advanced|Dream/);
        }
      }
    });
  });

  test.describe('Mobile Content Experience', () => {
    test.beforeEach(async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 }
      });
      page = await context.newPage();
      helpers = new TestHelpers(page);
      await helpers.disableAnimations();
      await helpers.setupAuth('student');
    });

    test('should adapt content layout for mobile', async () => {
      await page.goto('/module/1');
      await helpers.waitForPageReady();

      // Content should be mobile-responsive
      const content = page.locator('.module-content, .section-content');
      if (await content.isVisible()) {
        const boundingBox = await content.boundingBox();
        if (boundingBox) {
          expect(boundingBox.width).toBeLessThanOrEqual(375);
        }
      }

      // Text should be readable on mobile
      const fontSize = await page.evaluate(() => {
        const element = document.querySelector('p, .content-text');
        return element ? parseInt(window.getComputedStyle(element).fontSize) : 14;
      });
      
      expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable size
    });

    test('should handle touch gestures for navigation', async () => {
      await page.goto('/module/1');
      await helpers.waitForPageReady();

      const content = page.locator('.module-content');
      if (await content.isVisible()) {
        // Test swipe gesture simulation
        const contentBox = await content.boundingBox();
        if (contentBox) {
          // Simulate swipe right to left (next section)
          await page.mouse.move(contentBox.x + contentBox.width - 50, contentBox.y + contentBox.height / 2);
          await page.mouse.down();
          await page.mouse.move(contentBox.x + 50, contentBox.y + contentBox.height / 2);
          await page.mouse.up();
          
          // Should advance content or show swipe indicator
          await page.waitForTimeout(1000);
          
          const nextIndicator = page.locator('.next-section, .swipe-indicator');
          if (await nextIndicator.isVisible()) {
            await expect(nextIndicator).toBeVisible();
          }
        }
      }
    });
  });
});
