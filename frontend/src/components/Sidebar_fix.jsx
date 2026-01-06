// Add closing </div> before export
head -n 579 Sidebar.jsx > temp_sidebar.jsx
echo "    </div>" >> temp_sidebar.jsx
echo "  )" >> temp_sidebar.jsx
echo "}" >> temp_sidebar.jsx
echo "" >> temp_sidebar.jsx
echo "export default Sidebar" >> temp_sidebar.jsx
mv temp_sidebar.jsx Sidebar.jsx
echo "✅ JSX closing tags fixed"
