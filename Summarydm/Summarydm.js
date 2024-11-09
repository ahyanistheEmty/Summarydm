document.addEventListener("DOMContentLoaded", () => {
    window.addEventListener('beforeunload', function (e) {
        e.preventDefault();
        e.returnValue = '';
    });

    // Add a message handler for the window
    window.onmessage = function (e) {
        if (e.data === 'beforeunload') {
            e.preventDefault();
            e.returnValue = '';
        }
    };

    const textInput = document.getElementById('text-input');
    const fileInput = document.getElementById('file-input');
    const browseButton = document.getElementById('browse-button');
    const summarizeButton = document.getElementById('summarize-button');
    const summaryPopup = document.getElementById('summary-popup');
    const summaryOutput = document.getElementById('summary-output');
    const closeButton = document.querySelector('.close');

    browseButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                textInput.value = e.target.result;
            };
            reader.readAsText(file);
        }
    });

    textInput.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    textInput.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                textInput.value = e.target.result;
            };
            reader.readAsText(file);
        }
    });

    summarizeButton.addEventListener('click', async () => {
        const text = textInput.value.trim();
        if (text === '') return;

        summarizeButton.disabled = true;
        summarizeButton.textContent = 'Summarizing...';
        summarizeButton.classList.add('summarizing');

        try {
            const response = await fetch('https://dbwlqflm-3001.inc1.devtunnels.ms/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });
            if (!response.ok) {
                if (response.status === 413) {
                    throw new Error('PayloadTooLargeError');
                } else {
                    throw new Error(`Network response was not ok, status: ${response.status}`);
                }
            }

            const data = await response.json();
            let summary = data.summary;

            // Format the summary
            summary = formatBulletPointsAndBoldText(summary);

            // Create a new div element for the summary
            const summaryDiv = document.createElement('div');
            summaryDiv.innerHTML = `
                <pre class="code-block">${summary}</pre>
                <button class="copy-button">📋 Copy</button>
            `;

            // Clear the existing content
            summaryOutput.innerHTML = '';

            // Append the summary div to the popup content
            summaryOutput.appendChild(summaryDiv);

            // Show the summary popup
            summaryPopup.style.display = 'flex';

            // Add event listener to copy buttons
            document.querySelectorAll('.copy-button').forEach((button) => {
                button.addEventListener('click', (event) => {
                    const codeBlock = event.target.previousElementSibling;
                    const code = codeBlock.innerText;
                    navigator.clipboard.writeText(code).then(() => {
                        button.innerText = '✓ Copied!';
                        setTimeout(() => {
                            button.innerText = '📋 Copy';
                        }, 2000);
                    });
                });
            });

        } catch (error) {
            console.error('Fetch error:', error);
            if (error.message === 'PayloadTooLargeError') {
                alert('The text is too large, try making the text smaller.');
            } else {
                alert('A network error occurred. Please try again later.');
            }
        }

        summarizeButton.disabled = false;
        summarizeButton.textContent = 'Summarize';
        summarizeButton.classList.remove('Summarizing');
    });

    closeButton.addEventListener('click', () => {
        summaryPopup.style.display = 'none';
    });

    function formatBulletPointsAndBoldText(text) {
        // Replace lines starting with a hyphen followed by a space with bullet points
        let formattedText = text.replace(/^- /gm, '<li>');

        // Handle bold text within bullet points or numbered lines
        formattedText = formattedText.replace(/(<li>|\d+\.)\s*(\*\*.+?\*\*)/gm, '$1 <b>$2</b>');

        // General bold text handling
        formattedText = formattedText.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

        // Handle tables without bolding or highlighting inside
        const tableRegex = /(\|.+\|[\r\n|\n]+\|[-\s|:]+[\r\n|\n]+(?:\|.*\|[\r\n|\n]+)*)/gm;
        formattedText = formattedText.replace(tableRegex, (match) => {
            const rows = match.trim().split('\n').map(row => row.trim().split('|').filter(cell => cell.trim() !== ''));
            let tableHTML = '<table border="1" style="width:100%; border-collapse: collapse;">';
            rows.forEach((cells, index) => {
                tableHTML += '<tr>';
                cells.forEach(cell => {
                    cell = cell.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bolding inside table cells
                    tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${cell.trim()}</td>`;
                });
                tableHTML += '</tr>';
            });
            tableHTML += '</table>';
            return tableHTML;
        });

        return formattedText;
    }
});

// JavaScript for Menu Button
const menuBtn = document.getElementById('menu-btn');
const menuList = document.getElementById('menu-list');

menuBtn.addEventListener('click', () => {
    const isOpen = menuList.style.left === '0px';
    menuList.style.left = isOpen ? '-300px' : '0px';
});
