const { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  AlignmentType, 
  BorderStyle, 
  WidthType,
  PageBreak
} = require('docx');

/**
 * Dynamically builds a Microsoft Word (.docx) document from structured exam paper data.
 * @param {object} examData - Structured Exam JSON
 * @param {object} template - Formatting preferences
 * @returns {Promise<Buffer>} - Word document binary buffer
 */
const generateWordDocument = async (examData, template) => {
  // Safe defaults for template settings
  const font = template?.fontFamily || 'Arial';
  const spacingAfter = template?.questionSpacing || 8; // pt
  const rightAlignedMarks = template?.marksAlignment === 'right';
  const showLogoSpace = template?.headerStyle?.showLogoSpace || false;
  const showDivider = template?.headerStyle?.showDividerLine !== false;

  const children = [];

  // Helper: Create styled text run
  const createText = (text, options = {}) => {
    return new TextRun({
      text: text,
      font: font,
      bold: options.bold || false,
      italic: options.italic || false,
      size: (options.size || 11) * 2, // docx uses half-points (e.g., 24 = 12pt)
      color: options.color || '000000',
      underline: options.underline ? {} : undefined
    });
  };

  // Helper: Double Border Divider
  const createDivider = () => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        bottom: { style: BorderStyle.DOUBLE, size: 12, color: '333333' },
        left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        right: { style: BorderStyle.NONE, size: 0, color: 'auto' }
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ spacing: { before: 40, after: 40 } })],
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                right: { style: BorderStyle.NONE, size: 0, color: 'auto' }
              }
            })
          ]
        })
      ]
    });
  };

  // 1. HEADER TITLE BLOCK
  if (examData.title) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 100 },
        children: [
          createText(examData.title.toUpperCase(), { 
            bold: true, 
            size: template?.titleFontSize || 16 
          })
        ]
      })
    );
  }

  if (examData.subtitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          createText(examData.subtitle, { 
            bold: true, 
            size: template?.headerStyle?.subtitleFontSize || 12 
          })
        ]
      })
    );
  }

  if (examData.subject) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          createText(`SUBJECT: ${examData.subject.toUpperCase()}`, { 
            bold: true, 
            size: 12, 
            underline: true 
          })
        ]
      })
    );
  }

  // 2. META DETAILS ROW (Time & Marks)
  // We use a 1x3 table with invisible borders to perfectly align Time Allowed, Blank Logo space, and Max Marks.
  const metaColumns = [];
  
  metaColumns.push(
    new TableCell({
      width: { size: 35, type: WidthType.PERCENTAGE },
      children: [
        new Paragraph({
          children: [createText(`TIME ALLOWED: ${examData.timeAllowed || '3 Hours'}`, { bold: true, size: 10.5 })]
        })
      ],
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        right: { style: BorderStyle.NONE, size: 0, color: 'auto' }
      }
    })
  );

  // Logo space or blank spacer
  metaColumns.push(
    new TableCell({
      width: { size: 30, type: WidthType.PERCENTAGE },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: showLogoSpace ? [createText('[ SCHOOL LOGO ]', { italic: true, size: 9, color: '888888' })] : []
        })
      ],
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        right: { style: BorderStyle.NONE, size: 0, color: 'auto' }
      }
    })
  );

  // Max Marks
  metaColumns.push(
    new TableCell({
      width: { size: 35, type: WidthType.PERCENTAGE },
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [createText(`MAXIMUM MARKS: ${examData.maxMarks || 100}`, { bold: true, size: 10.5 })]
        })
      ],
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        right: { style: BorderStyle.NONE, size: 0, color: 'auto' }
      }
    })
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' }
      },
      rows: [
        new TableRow({ children: metaColumns })
      ]
    })
  );

  // Elegant dividing border under titles
  if (showDivider) {
    children.push(createDivider());
  }

  // Spacer
  children.push(new Paragraph({ spacing: { after: 120 } }));

  // 3. GENERAL INSTRUCTIONS
  if (examData.generalInstructions && examData.generalInstructions.length > 0) {
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [createText('General Instructions:', { bold: true, size: 11, underline: true })]
      })
    );

    examData.generalInstructions.forEach((inst, index) => {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          indent: { left: 360 }, // 360 twips = 0.25 inch indentation
          children: [
            createText(`${index + 1}. `, { bold: true, size: 10.5 }),
            createText(inst, { size: 10.5 })
          ]
        })
      );
    });

    children.push(new Paragraph({ spacing: { after: 140 } }));
  }

  // 4. EXAM SECTIONS
  if (examData.sections && examData.sections.length > 0) {
    examData.sections.forEach((section, secIdx) => {
      // Add a page break between sections if requested or after Section 1
      if (secIdx > 0 && template?.borderStyle === 'double') {
        children.push(new Paragraph({ children: [new PageBreak()] }));
      }

      // Section title paragraph
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 180, after: 80 },
          children: [
            createText(section.title.toUpperCase(), { 
              bold: true, 
              size: 12, 
              underline: true 
            })
          ]
        })
      );

      // Section sub-instruction
      if (section.instruction) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 140 },
            children: [
              createText(section.instruction, { italic: true, size: 10.5 })
            ]
          })
        );
      }

      // Section questions
      if (section.questions && section.questions.length > 0) {
        section.questions.forEach((q) => {
          
          // Layout question and marks.
          // If right-aligned marks are enabled, we put them in a borderless 2-column grid.
          if (rightAlignedMarks && q.marks > 0) {
            children.push(
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' }
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 85, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            spacing: { before: 80, after: spacingAfter },
                            children: [
                              createText(`${q.number ? q.number + ' ' : ''}`, { bold: true, size: 11 }),
                              createText(q.text, { size: 11 })
                            ]
                          })
                        ],
                        borders: {
                          top: { style: BorderStyle.NONE },
                          bottom: { style: BorderStyle.NONE },
                          left: { style: BorderStyle.NONE },
                          right: { style: BorderStyle.NONE }
                        }
                      }),
                      new TableCell({
                        width: { size: 15, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 80, after: spacingAfter },
                            children: [
                              createText(`[${q.marks}]`, { bold: true, size: 11 })
                            ]
                          })
                        ],
                        borders: {
                          top: { style: BorderStyle.NONE },
                          bottom: { style: BorderStyle.NONE },
                          left: { style: BorderStyle.NONE },
                          right: { style: BorderStyle.NONE }
                        }
                      })
                    ]
                  })
                ]
              })
            );
          } else {
            // Inline marks formatting
            const questionChildren = [
              createText(`${q.number ? q.number + ' ' : ''}`, { bold: true, size: 11 }),
              createText(q.text, { size: 11 })
            ];
            
            if (q.marks > 0) {
              questionChildren.push(createText(`  (${q.marks})`, { bold: true, size: 11 }));
            }

            children.push(
              new Paragraph({
                spacing: { before: 80, after: spacingAfter },
                children: questionChildren
              })
            );
          }

          // A. MCQ options layouts
          if (q.options && q.options.length > 0) {
            // Check if we can lay them out in a 2x2 grid (if short) or 1 per line (if long)
            const allShort = q.options.every(opt => opt.length < 25);
            
            if (allShort && q.options.length === 4) {
              // Lay out in a 2x2 grid using a borderless table
              children.push(
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                    insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' }
                  },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          children: [new Paragraph({ indent: { left: 400 }, children: [createText(q.options[0], { size: 10.5 })] })],
                          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                        }),
                        new TableCell({
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          children: [new Paragraph({ children: [createText(q.options[1], { size: 10.5 })] })],
                          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                        })
                      ]
                    }),
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          children: [new Paragraph({ indent: { left: 400 }, children: [createText(q.options[2], { size: 10.5 })] })],
                          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                        }),
                        new TableCell({
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          children: [new Paragraph({ children: [createText(q.options[3], { size: 10.5 })] })],
                          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                        })
                      ]
                    })
                  ]
                })
              );
            } else {
              // Regular list (one per line)
              q.options.forEach((opt) => {
                children.push(
                  new Paragraph({
                    indent: { left: 400 },
                    spacing: { after: 30 },
                    children: [createText(opt, { size: 10.5 })]
                  })
                );
              });
            }
          }

          // B. Sub-questions list
          if (q.subQuestions && q.subQuestions.length > 0) {
            q.subQuestions.forEach((subq) => {
              children.push(
                new Paragraph({
                  indent: { left: 400 },
                  spacing: { after: 30 },
                  children: [
                    createText(`${subq.number ? subq.number + ' ' : ''}`, { bold: true, size: 10.5 }),
                    createText(subq.text, { size: 10.5 })
                  ]
                })
              );
            });
          }
        });
      }
    });
  }

  // 5. COMPILE DOCUMENT
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: template?.margins?.top || 1440,
            bottom: template?.margins?.bottom || 1440,
            left: template?.margins?.left || 1440,
            right: template?.margins?.right || 1440
          }
        }
      },
      children: children
    }]
  });

  return await Packer.toBuffer(doc);
};

module.exports = {
  generateWordDocument
};
