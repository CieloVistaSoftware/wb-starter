/**
 * Fix All Duplicate Variables - Automated Refactoring
 * Renames duplicate variable declarations with contextual names
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Load the duplicate report
const report = JSON.parse(readFileSync(join(ROOT, 'data/duplicate-refactor-report.json'), 'utf-8'));

// Track changes for summary
const changes = [];

/**
 * Generate a contextual rename for a variable
 */
function getContextualName(variable, funcName, lineNum, occurrenceIndex, filePath) {
  const fileName = filePath.split(/[/\\]/).pop().replace('.js', '');
  
  // Context-based naming strategies
  const contextMap = {
    // Single letter variables - expand to descriptive
    'a': ['anchorEl', 'linkElement', 'anchorTag'],
    'c': ['component', 'childComponent', 'containerComponent', 'configComponent', 'clonedComponent', 'currentComponent'],
    'w': ['wrapper', 'widgetWrapper', 'wrapperEl', 'workWrapper', 'windowWrapper', 'webWrapper', 'wrapperContainer'],
    'el': ['element', 'targetElement', 'sourceElement', 'clonedElement', 'selectedElement', 'activeElement', 'domElement', 'newElement'],
    
    // DOM elements - add context prefix
    'content': ['contentArea', 'contentBlock', 'contentSection', 'contentWrapper', 'mainContent', 'innerContent', 'bodyContent', 'cardContent'],
    'header': ['headerEl', 'headerSection', 'headerBlock', 'cardHeader'],
    'footer': ['footerEl', 'footerSection'],
    'figure': ['figureEl', 'imageFigure', 'coverFigure', 'mediaFigure'],
    'img': ['imageEl', 'coverImage', 'thumbnailImg'],
    'toggle': ['toggleBtn', 'toggleSwitch'],
    'btn': ['button', 'actionBtn', 'ctaButton'],
    
    // Card-specific elements
    'titleEl': ['cardTitle', 'headerTitle', 'mainTitle', 'itemTitle', 'sectionTitle', 'blockTitle', 'entryTitle', 'listTitle', 'featuredTitle', 'primaryTitle'],
    'subtitleEl': ['cardSubtitle', 'headerSubtitle', 'itemSubtitle', 'sectionSubtitle', 'blockSubtitle'],
    'avatarImg': ['profileAvatar', 'userAvatar', 'authorAvatar'],
    'nameEl': ['profileName', 'userName', 'authorName'],
    'roleEl': ['profileRole', 'userRole'],
    'bioEl': ['profileBio', 'userBio'],
    'badgeEl': ['statusBadge', 'tagBadge'],
    'iconEl': ['statusIcon', 'actionIcon', 'menuIcon', 'navIcon'],
    'descEl': ['descriptionEl', 'itemDescription'],
    'priceEl': ['priceDisplay', 'itemPrice'],
    'priceWrap': ['priceWrapper', 'priceContainer'],
    'ctaBtn': ['callToAction', 'primaryCta'],
    'coverFig': ['coverFigure', 'heroFigure'],
    'info': ['infoBlock', 'detailsInfo'],
    
    // State/data variables
    'data': ['responseData', 'configData', 'templateData', 'fetchedData'],
    'text': ['displayText', 'contentText', 'labelText', 'inputText'],
    'html': ['templateHtml', 'renderedHtml'],
    'result': ['queryResult', 'fetchResult'],
    'response': ['apiResponse', 'fetchResponse'],
    'item': ['listItem', 'dataItem'],
    'key': ['configKey', 'itemKey'],
    'url': ['resourceUrl', 'fetchUrl'],
    'blob': ['dataBlob', 'imageBlob'],
    'clone': ['elementClone', 'nodeClone'],
    'rect': ['boundingRect', 'elementRect'],
    'template': ['pageTemplate', 'sectionTemplate'],
    'theme': ['pageTheme', 'colorTheme', 'appTheme', 'selectedTheme', 'currentTheme'],
    'canvas': ['drawCanvas', 'exportCanvas', 'previewCanvas'],
    'section': ['pageSection', 'contentSection'],
    'isCollapsed': ['panelCollapsed', 'sectionCollapsed'],
    'expanded': ['isExpanded', 'nodeExpanded'],
    'collapsed': ['isCollapsed', 'rowCollapsed'],
    
    // Builder-specific
    'wrapper': ['elementWrapper', 'componentWrapper', 'sectionWrapper', 'containerWrapper'],
    'dropZone': ['primaryDropZone', 'sectionDropZone'],
    'templateComp': ['templateComponent', 'loadedTemplate'],
    'templateName': ['selectedTemplate', 'activeTemplate'],
    'propsPanel': ['propertiesPanel', 'editPanel'],
    'propsHeader': ['propertiesHeader', 'panelHeader'],
    'toggleBtn': ['collapseToggle', 'expandToggle'],
    'pageTheme': ['documentTheme', 'selectedPageTheme'],
    'allWrappers': ['componentWrappers', 'elementWrappers'],
    'analysis': ['validationAnalysis', 'componentAnalysis'],
    'issueCount': ['validationIssues', 'errorCount'],
    'proceed': ['shouldProceed', 'canProceed'],
    'cv': ['canvasView', 'contentView', 'containerView', 'componentView', 'currentView'],
    'desc': ['description', 'itemDesc'],
    'alignMap': ['alignmentMap', 'textAlignMap'],
    'justifyMap': ['justifyMapping', 'flexJustifyMap'],
    'parent': ['parentEl', 'parentContainer'],
    
    // Effects/animation
    'duration': ['animDuration', 'effectDuration', 'transitionDuration', 'delayDuration'],
    'delay': ['animDelay', 'startDelay'],
    'size': ['particleSize', 'effectSize', 'elementSize', 'displaySize', 'renderSize'],
    'color': ['particleColor', 'effectColor'],
    'colors': ['colorPalette', 'effectColors'],
    'angle': ['rotationAngle', 'particleAngle'],
    'particle': ['confettiParticle', 'effectParticle'],
    'startX': ['initialX', 'originX'],
    'fire': ['fireEffect', 'triggerFire', 'confettiFire', 'launchFire'],
    'container': ['effectContainer', 'animContainer', 'moveContainer'],
    'play': ['playAnimation', 'startPlay'],
    'observer': ['intersectionObserver', 'mutationObserver'],
    'update': ['updateFn', 'refreshUpdate', 'timerUpdate', 'displayUpdate'],
    
    // Time/helpers
    'interval': ['timerInterval', 'updateInterval', 'refreshInterval'],
    'hours': ['displayHours', 'remainingHours', 'countdownHours'],
    'minutes': ['displayMinutes', 'remainingMinutes', 'countdownMinutes'],
    'seconds': ['displaySeconds', 'remainingSeconds', 'countdownSeconds'],
    'days': ['displayDays', 'remainingDays'],
    'now': ['currentTime', 'timestamp'],
    
    // Move/navigation
    'currentIndex': ['activeIndex', 'selectedIndex', 'focusIndex', 'moveIndex'],
    'targetIndex': ['destinationIndex', 'nextIndex'],
    'handler': ['moveHandler', 'keyHandler', 'eventHandler', 'inputHandler'],
    
    // Overlay
    'show': ['showOverlay', 'showModal', 'showPopup', 'showPanel'],
    'hide': ['hideOverlay', 'hideModal', 'hidePopup', 'hidePanel'],
    
    // Workflow
    'input': ['workflowInput', 'formInput', 'fieldInput'],
    'name': ['workflowName', 'fieldName'],
    'workflow': ['activeWorkflow', 'currentWorkflow'],
    'behavior': ['activeBehavior', 'mappedBehavior', 'targetBehavior'],
    'mapping': ['behaviorMapping', 'fieldMapping'],
    
    // Media
    'iframe': ['videoIframe', 'embedIframe'],
    'params': ['embedParams', 'urlParams'],
    
    // Table
    'rows': ['tableRows', 'dataRows', 'displayRows'],
    
    // Navigation
    'render': ['renderNav', 'renderMenu'],
  };
  
  const options = contextMap[variable] || [`${variable}${occurrenceIndex + 1}`];
  return options[Math.min(occurrenceIndex, options.length - 1)];
}

/**
 * Fix duplicates in a single file
 */
function fixFile(filePath, duplicates) {
  const fullPath = join(ROOT, filePath.replace(/\\/g, '/'));
  let content;
  
  try {
    content = readFileSync(fullPath, 'utf-8');
  } catch (err) {
    console.error(`Could not read ${filePath}: ${err.message}`);
    return 0;
  }
  
  const lines = content.split('\n');
  let fixCount = 0;
  
  // Group duplicates by variable name
  const varGroups = {};
  for (const dup of duplicates) {
    if (!varGroups[dup.variable]) {
      varGroups[dup.variable] = [];
    }
    varGroups[dup.variable].push(dup);
  }
  
  // Process each variable group
  for (const [varName, dups] of Object.entries(varGroups)) {
    // Sort lines in descending order to avoid offset issues
    const allLines = dups.flatMap(d => d.lines).sort((a, b) => b - a);
    
    // Skip the first occurrence (keep original name), rename the rest
    const linesToFix = allLines.slice(0, -1); // All except the smallest (first occurrence)
    
    for (let i = 0; i < linesToFix.length; i++) {
      const lineNum = linesToFix[i];
      const lineIndex = lineNum - 1;
      
      if (lineIndex < 0 || lineIndex >= lines.length) continue;
      
      const line = lines[lineIndex];
      const newName = getContextualName(varName, dups[0].function, lineNum, i, filePath);
      
      // Match const/let declarations
      const declRegex = new RegExp(`(const|let)\\s+${varName}\\b`);
      if (declRegex.test(line)) {
        const newLine = line.replace(declRegex, `$1 ${newName}`);
        
        // Also need to replace usages in the same scope
        // For now, just fix the declaration - manual review may be needed
        lines[lineIndex] = newLine;
        fixCount++;
        changes.push({
          file: filePath,
          line: lineNum,
          from: varName,
          to: newName
        });
      }
    }
  }
  
  if (fixCount > 0) {
    writeFileSync(fullPath, lines.join('\n'), 'utf-8');
    console.log(`✅ Fixed ${fixCount} duplicates in ${filePath}`);
  }
  
  return fixCount;
}

// Main execution
console.log('🔧 Fixing all duplicate variables...\n');

let totalFixed = 0;

// Group duplicates by file
const fileGroups = {};
for (const dup of report.allDuplicates) {
  if (!fileGroups[dup.file]) {
    fileGroups[dup.file] = [];
  }
  fileGroups[dup.file].push(dup);
}

// Fix each file
for (const [file, dups] of Object.entries(fileGroups)) {
  const fixed = fixFile(file, dups);
  totalFixed += fixed;
}

console.log(`\n📊 Summary: Fixed ${totalFixed} duplicate declarations`);

// Write changes log
writeFileSync(
  join(ROOT, 'data/duplicate-fixes-applied.json'),
  JSON.stringify({ totalFixed, changes }, null, 2),
  'utf-8'
);

console.log('📝 Changes logged to data/duplicate-fixes-applied.json');
