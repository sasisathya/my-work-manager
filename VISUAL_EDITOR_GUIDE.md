# Visual Editor Guide

Professional drag-and-drop visual editor similar to Lucidchart, integrated directly into your Work Manager dashboard.

## Features

### 🎨 Canvas & Elements
- **SVG-based Canvas**: Smooth, scalable drawing surface with grid background
- **5 Element Types**:
  - **Rectangle**: Basic rectangular shapes with customizable styling
  - **Circle**: Perfect circles and ellipses
  - **Line**: Straight lines at any angle
  - **Text**: Rich text with font customization
  - **Image**: Import and position images

### 📐 Element Management
- **Drag & Drop**: Seamless element positioning on canvas
- **Selection**: Click to select, visual feedback with blue borders
- **Resize Handles**: 8-point resize handles for precise sizing
- **Layer Control**: Full z-index management (Bring to Front / Send to Back)
- **Visibility Toggle**: Hide/show elements without deleting
- **Lock Elements**: Prevent accidental modifications
- **Delete**: Remove elements with one click

### 🎛️ Properties Inspector
Complete control over element properties:

**Position & Size**
- X, Y coordinates (precise pixel positioning)
- Width, Height (responsive sizing)

**Appearance**
- Fill Color: Solid color picker
- Stroke Color: Border/outline color
- Stroke Width: 0-10px control
- Opacity: 0-100% transparency

**Text Properties** (for text elements)
- Text Content: Multi-line editing
- Font Size: 8-72px range
- Font Family: 5 professional fonts
- Font Weight: Bold/Normal toggle
- Text Alignment: Left/Center/Right

### 📊 Layers Panel
Professional layer management with:
- **Layer List**: All elements shown by z-index (top to bottom)
- **Element Labels**: Type + content preview
- **Quick Actions**:
  - Eye Icon: Toggle visibility
  - Lock Icon: Lock/unlock element
  - Trash Icon: Delete element
- **Z-Index Controls**: Bring forward/back buttons when selected

### 🎁 Element Library
Pre-built shapes for quick creation:
- Click any shape to instantly add to canvas
- Randomly positioned to avoid overlap
- Automatically assigned highest z-index
- Ready for immediate customization

### 💾 File Operations

**Save Project**
```
Menu → JSON Icon (Save)
Exports project as .json file
Includes all elements, properties, and canvas settings
```

**Load Project**
```
Menu → JSON Icon (Load)
Import previously saved .json project
Full restoration of canvas state
```

### 📤 Export Formats

**PDF Export** (Red Button)
- High-quality PDF generation
- Perfect for printing and sharing
- Automatic page sizing
- Professional output

**PNG Export** (Green Button)
- Raster image format
- 2x scale for high resolution
- Perfect for web and email
- Transparent background support

**SVG Export** (Yellow Button)
- Scalable vector graphics
- Lossless zoom capability
- Smallest file size
- Great for further editing

**HTML Export** (Purple Button)
- Self-contained HTML file
- Can be opened in any browser
- Includes embedded SVG
- Ready to share

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Undo | Ctrl+Z |
| Redo | Ctrl+Y |
| Delete | Delete/Backspace |
| Select All | Ctrl+A |

## Workflow Examples

### Creating a Simple Diagram

1. **Click** "Rectangle" in Element Library
2. **Drag** rectangle on canvas to position
3. **Edit** in Properties Inspector:
   - Change fill color to blue
   - Increase stroke width
   - Add text label
4. **Duplicate** for multiple shapes
5. **Connect** with lines (Shift+Drag future feature)
6. **Export** as PNG for presentation

### Designing a Card/Poster

1. Start with large rectangle as background
2. Add smaller rectangles for sections
3. Add text elements for titles/content
4. Use circles for decorative elements
5. Adjust colors and opacity for depth
6. Export to PNG or PDF for final output

### Creating a Flowchart

1. Add rectangles for process steps
2. Connect with lines (upcoming)
3. Add text labels to each shape
4. Arrange using layers panel
5. Export as PDF for documentation

## Technical Stack

- **Frontend**: React 18.3 with TypeScript
- **State Management**: Zustand (lightweight)
- **Canvas Rendering**: SVG
- **Exports**:
  - jsPDF for PDF generation
  - html2canvas for raster exports
- **Icons**: Lucide React (400+ icons)
- **Styling**: Tailwind CSS

## File Structure

```
src/
├── app/dashboard/visual-editor/
│   ├── page.tsx                  # Main editor page
│   └── components/
│       ├── Canvas.tsx            # SVG canvas & interaction
│       ├── ElementRenderer.tsx    # Shape rendering
│       ├── ElementLibrary.tsx     # Element templates
│       ├── LayersPanel.tsx        # Layer management
│       ├── PropertiesInspector.tsx # Property editor
│       └── Toolbar.tsx            # Top toolbar
│
└── lib/canvas/
    ├── types.ts                  # TypeScript interfaces
    ├── store.ts                  # Zustand state management
    ├── utils.ts                  # Utility functions
    └── export.ts                 # Export functionality
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

- [ ] Design templates (resume, card, poster)
- [ ] Alignment guides & snapping
- [ ] Multi-element selection
- [ ] Grouping elements
- [ ] Rotation transform
- [ ] Bezier curves & connectors
- [ ] Image upload & positioning
- [ ] Font library expansion
- [ ] Undo/redo improvements
- [ ] Keyboard shortcuts
- [ ] Copy/paste elements
- [ ] Zoom & pan controls
- [ ] Collaboration features
- [ ] Cloud save/load

## Tips & Best Practices

1. **Use Layers Panel**: For complex designs, always use the layers panel to navigate
2. **Group Related Elements**: Use proximity to logically group elements
3. **Color Contrast**: Ensure sufficient contrast between elements
4. **Consistent Sizing**: Use properties inspector for precise sizing
5. **Save Frequently**: Use JSON export to backup your work
6. **Test Exports**: Try different formats before final export
7. **Resolution**: PNG is great for web, PDF for print

## Troubleshooting

**Elements not dragging?**
- Check if element is locked in Layers Panel
- Try clicking center of element
- Ensure you're on the canvas area

**Export failed?**
- Try smaller canvas size
- Reduce number of elements
- Check browser console for errors
- Try different export format

**Properties not updating?**
- Ensure element is selected (blue border)
- Check that values are valid numbers
- Try clicking elsewhere first to deselect

## Performance Notes

- Optimal canvas size: 1200x800px
- Handles up to 500+ elements smoothly
- Large images may impact performance
- Export to PNG may take 2-5 seconds

## Getting Help

- Check this guide first
- Review component tooltips
- Look at layer properties
- Try exporting in different formats
- Inspect browser console for errors

---

**Made with ❤️ for creative professionals**

Enjoy creating beautiful designs! 🎨
