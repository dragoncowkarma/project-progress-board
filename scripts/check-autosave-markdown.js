const assert = require('assert');

// Test Markdown Parsing Simulation (matching TaskDetailsModal implementation)
const parseMarkdownToHtml = (text) => {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
  
  const lines = html.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (
      trimmed.startsWith('<h') || 
      trimmed.startsWith('<li') || 
      trimmed.startsWith('<pre') || 
      trimmed.startsWith('</pre>') || 
      trimmed.startsWith('<code>') || 
      trimmed.startsWith('</code>') || 
      trimmed === ''
    ) {
      return line;
    }
    return `<p>${line}</p>`;
  });
  return processedLines.join('\n');
};

try {
  console.log('Verifying Markdown Parser & Checklist Calculations...');
  
  // 1. Test header conversions
  assert.ok(parseMarkdownToHtml('# Title').includes('<h1>Title</h1>'), 'Should parse h1 headers');
  assert.ok(parseMarkdownToHtml('## Sec').includes('<h2>Sec</h2>'), 'Should parse h2 headers');
  
  // 2. Test bold text
  assert.ok(parseMarkdownToHtml('some **bold** word').includes('<strong>bold</strong>'), 'Should parse bold text');

  // 3. Test Checklist Progress Calculations
  const checklists = [
    { id: '1', text: 'Task A', checked: true },
    { id: '2', text: 'Task B', checked: false },
    { id: '3', text: 'Task C', checked: true }
  ];
  const completedCount = checklists.filter(item => item.checked).length;
  const totalCount = checklists.length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  assert.strictEqual(completedCount, 2, 'Completed count should be 2');
  assert.strictEqual(totalCount, 3, 'Total count should be 3');
  assert.strictEqual(percentComplete, 67, 'Percentage complete should be 67%');

  console.log('✅ Markdown and Checklist checks passed successfully!');
  process.exit(0);
} catch (err) {
  console.error('❌ Markdown and Checklist checks failed:', err.message);
  process.exit(1);
}
