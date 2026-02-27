// Apple 数据访问模块 - 通过 AppleScript 访问 Reminders/Calendar/Notes

// 读取 Reminders 待办事项
export async function getReminders(): Promise<Reminder[]> {
  return new Promise((resolve) => {
    const { exec } = require('child_process');

    // AppleScript 读取所有待办
    const script = `
      tell application "Reminders"
        set result to ""
        repeat with aList in lists
          set listName to name of aList
          repeat with r in (every reminder of aList whose completed is false)
            set dueDateStr to ""
            if due date of r is not missing value then
              set dueDateStr to " | due:" & (due date of r)
            end if
            set result to result & listName & "||" & (name of r) & dueDateStr & "\\n"
          end repeat
        end repeat
        return result
      end tell
    `;

    exec(`osascript -e '${script.replace(/\n/g, '')}'`, (error: any, stdout: string) => {
      if (error || !stdout.trim()) {
        resolve([]);
        return;
      }

      const reminders: Reminder[] = [];
      stdout.trim().split('\n').forEach((line) => {
        const [list, ...rest] = line.split('||');
        const [title, dueInfo] = rest.join('||').split(' | due:');
        reminders.push({
          list,
          title,
          dueDate: dueInfo ? new Date(dueInfo) : null,
        });
      });
      resolve(reminders);
    });
  });
}

// 读取 Calendar 日程事件
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  return new Promise((resolve) => {
    const { exec } = require('child_process');

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // AppleScript 读取今天和明天的事件
    const script = `
      tell application "Calendar"
        set result to ""
        set startDate to current date
        set endDate to startDate + 2 * days
        repeat with aCalendar in calendars
          repeat with e in (every event of aCalendar whose start date is greater than startDate and start date is less than endDate)
            set result to result & (name of e) & "||" & (start date of e) & "||" & (end date of e) & "\\n"
          end repeat
        end repeat
        return result
      end tell
    `;

    exec(`osascript -e '${script.replace(/\n/g, '')}'`, (error: any, stdout: string) => {
      if (error || !stdout.trim()) {
        resolve([]);
        return;
      }

      const events: CalendarEvent[] = [];
      stdout.trim().split('\n').forEach((line) => {
        const [title, startStr, endStr] = line.split('||');
        events.push({
          title,
          startDate: new Date(startStr),
          endDate: new Date(endStr),
        });
      });
      resolve(events);
    });
  });
}

// 读取 Notes 笔记
export async function getNotes(): Promise<Note[]> {
  return new Promise((resolve) => {
    const { exec } = require('child_process');

    // AppleScript 读取所有笔记
    const script = `
      tell application "Notes"
        set result to ""
        repeat with aNote in (every note of folder "Notes" of account "iCloud")
          set result to result & (name of aNote) & "||" & (body of aNote) & "\\n$$$\\n"
        end repeat
        return result
      end tell
    `;

    exec(`osascript -e '${script.replace(/\n/g, '')}'`, { maxBuffer: 10 * 1024 * 1024 }, (error: any, stdout: string) => {
      if (error || !stdout.trim()) {
        resolve([]);
        return;
      }

      const notes: Note[] = [];
      const chunks = stdout.split('$$$\n');
      chunks.forEach((chunk) => {
        const lines = chunk.trim().split('\n');
        if (lines.length >= 1) {
          const firstLine = lines[0];
          const [title, ...bodyParts] = firstLine.split('||');
          const body = bodyParts.join('||') + '\n' + lines.slice(1).join('\n');
          if (title.trim()) {
            notes.push({
              title: title.trim(),
              body: body.trim(),
            });
          }
        }
      });
      resolve(notes);
    });
  });
}

// 创建 Calendar 事件
export function createCalendarEvent(title: string, startDate: Date, endDate?: Date): Promise<void> {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    const end = endDate || new Date(startDate.getTime() + 60 * 60 * 1000); // 默认 1 小时

    const script = `
      tell application "Calendar"
        tell calendar "Calendar"
          make new event at end with properties {summary:"${title}", start date:date "${startDate.toISOString()}", end date:date "${end.toISOString()}"}
        end tell
        tell application "System Events"
          keystroke return
        end tell
      end tell
    `;

    exec(`osascript -e '${script.replace(/\n/g, '')}'`, (error: any) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

// 创建 Reminder 待办
export function createReminder(title: string, listName = 'Reminders'): Promise<void> {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');

    const script = `
      tell application "Reminders"
        tell list "${listName}"
          make new reminder with properties {name:"${title}"}
        end tell
      end tell
    `;

    exec(`osascript -e '${script.replace(/\n/g, '')}'`, (error: any) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

// 创建 Notes 笔记
export function createNote(title: string, body: string, folderName = 'Notes'): Promise<void> {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');

    const escapedBody = body.replace(/"/g, '\\"').replace(/\n/g, '\\\n');

    const script = `
      tell application "Notes"
        tell folder "${folderName}" of account "iCloud"
          make new note with properties {name:"${title}", body:"${escapedBody}"}
        end tell
      end tell
    `;

    exec(`osascript -e '${script.replace(/\n/g, '')}'`, (error: any) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

export interface Reminder {
  list: string;
  title: string;
  dueDate: Date | null;
}

export interface CalendarEvent {
  title: string;
  startDate: Date;
  endDate: Date;
}

export interface Note {
  title: string;
  body: string;
}
