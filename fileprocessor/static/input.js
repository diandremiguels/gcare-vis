// First, set up the input box to appropriately format text once it is edited.
window.addEventListener("DOMContentLoaded", (event) => {
    const userInput = document.getElementById("user-input");
    userInput?.addEventListener('input', () => {
        const plainText = userInput.innerText;
        console.log(plainText);
        updateContent(plainText);
    })
})


// Highlights a specified range of colors.
function highlightSpans(start, end, exists = true) {
    const spans = document.querySelectorAll('#user-input span');
    spans.forEach((span, index) => {
        if (index >= start && index < end) {
            // If the range of characters corresponds to an element of the diagram, we highlight it.
            // Otherwise, we mark it a different color to indicate there will be no other interaction.
            span.classList.add(exists ? 'highlighted' : 'bad-highlighted');
        }
    })
}

// Removes all highlights from the input text.
function removeSpanHighlights() {
    const spans = document.querySelectorAll('#user-input span');
    spans.forEach((span, index) => {
        span.classList.remove('highlighted');
        span.classList.remove('bad-highlighted');
    })
}

// Each character in the input box is converted into a span object.
// For each span covering a character, we attach mouse events that trigger
// appropriate highlights for a range of characters and the corresponding diagram element.
function attachSpanEvents() {
    document.querySelectorAll('#user-input span').forEach(span => {
        span.addEventListener('mouseover', () => {
            removeSpanHighlights();
            const index = Number(span.getAttribute('data-char-index'));
            const nodes = document.querySelectorAll('.node');
            const edges = document.querySelectorAll('.edge');
            const nodeLabels = document.querySelectorAll('.node-label');
            const edgeLabels = document.querySelectorAll('.edge-label');
            // find the element that this index belongs to
            nodes.forEach(node => {
                const min = Number(node.getAttribute('min'));
                const max = Number(node.getAttribute('max'));
                if (index >= min && index < max) {
                    // We found the correct object
                    node.setAttribute("fill", "orange");
                    highlightSpans(min, max);
                }
            });
            edges.forEach(edge => {
                const min = Number(edge.getAttribute('min'));
                const max = Number(edge.getAttribute('max'));
                if (index >= min && index < max) {
                    // We found the correct object
                    edge.setAttribute("stroke", "orange");
                    highlightSpans(min, max);
                }
            });
            nodeLabels.forEach(label => {
                const min = Number(label.getAttribute('min'));
                const max = Number(label.getAttribute('max'));
                if (index >= min && index < max) {
                    // depending on if the label actually contributes to the diagram,
                    // we either highlight the text or mark it a different color.
                    label.setAttribute("fill", label.textContent !== "" ? "orange" : "black");
                    highlightSpans(min, max, label.textContent !== "");
                }
            });
            edgeLabels.forEach(label => {
                const min = Number(label.getAttribute('min'));
                const max = Number(label.getAttribute('max'));
                if (index >= min && index < max) {
                    // depending on if the label actually contributes to the diagram,
                    // we either highlight the text or mark it a different color.
                    label.setAttribute("fill", label.textContent !== "" ? "orange" : "black");
                    highlightSpans(min, max, label.textContent !== "");
                }
            });
        });
        span.addEventListener('mouseout', () => {
            removeSpanHighlights();
            const index = Number(span.getAttribute('data-char-index'));
            const nodes = document.querySelectorAll('.node');
            const edges = document.querySelectorAll('.edge');
            const nodeLabels = document.querySelectorAll('.node-label');
            const edgeLabels = document.querySelectorAll('.edge-label');
            // find the element that this index belongs to
            nodes.forEach(node => {
                const min = Number(node.getAttribute('min'));
                const max = Number(node.getAttribute('max'));
                if (index >= min && index < max) {
                    // We found the correct object
                    node.setAttribute("fill", "steelblue");
                }
            });
            edges.forEach(edge => {
                const min = Number(edge.getAttribute('min'));
                const max = Number(edge.getAttribute('max'));
                if (index >= min && index < max) {
                    // We found the correct object
                    edge.setAttribute("stroke", "gray");
                }
            });
            nodeLabels.forEach(label => {
                const min = Number(label.getAttribute('min'));
                const max = Number(label.getAttribute('max'));
                if (index >= min && index < max) {
                    // We found the correct object
                    label.setAttribute("fill", "black");
                }
            });
            edgeLabels.forEach(label => {
                const min = Number(label.getAttribute('min'));
                const max = Number(label.getAttribute('max'));
                if (index >= min && index < max) {
                    // We found the correct object
                    label.setAttribute("fill", "black");
                }
            });
        });
    })
}

// Replaces characters in a string that need to be escaped in HTML.
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
        .replace(/ {2}/g, ' &nbsp;');
}

// Extracts the plain text from the spans underlying the input box.
function extractTextFromInput() {
    const userInput = document.getElementById('user-input');
    // Get all the <span> elements inside the contenteditable div
    const spans = userInput.getElementsByTagName('span');
    // Concatenate the text content of each span
    let originalText = '';
    for (let span of spans) {
        originalText += span.textContent || span.innerText; // Get text inside the span
    }
    return originalText;
}

// Returns html representing text replaced with spans encompassing every character.
// If characters are replaced with spans, we can do tricks to create interactivity.
function wrapSpans(text) {
    let result = '';
    // Loop over every character in the text
    if (text !== undefined) {
        for (let i = 0; i < text.length; i++) {
            result += `<span data-char-index="${i}">${escapeHTML(text[i])}</span>`;
        }
    }
    return result;
}

// Returns the position of the caret in the input box for typing.
function getCaretCharacterOffsetWithin(element) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
}

// Sets the position fo the caret in the input box for typing.
function setCaretPosition(element, offset) {
    const selection = window.getSelection();
    const range = document.createRange();
    let currentOffset = 0;
    const nodeStack = [element];
    let node;
    while ((node = nodeStack.pop())) {
        if (node.nodeType === 3) {
            const nextOffset = currentOffset + node.length;
            if (offset <= nextOffset) {
                range.setStart(node, offset - currentOffset);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                return;
            }
            currentOffset = nextOffset;
        } else {
            let i = node.childNodes.length;
            while (i--) {
                nodeStack.push(node.childNodes[i]);
            }
        }
    }
}

// Updates the caret position and the span objects to match the current text in the input box.
function updateContent(text) {
    const editor = document.getElementById("user-input");
    const caret = getCaretCharacterOffsetWithin(editor);
    editor.innerHTML = wrapSpans(text);
    setCaretPosition(editor, caret);
}