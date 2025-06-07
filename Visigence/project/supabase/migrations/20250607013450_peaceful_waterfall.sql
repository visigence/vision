/*
  # Sample Data for Development

  1. Sample Categories
  2. Sample Tags
  3. Sample Admin User
  4. Sample Content
*/

-- Insert sample categories
INSERT INTO categories (name, slug, description, color, icon, sort_order) VALUES
('Web Development', 'web-development', 'Modern web applications and websites', '#3b82f6', 'code', 1),
('3D Modeling', '3d-modeling', '3D assets and visualizations', '#8b5cf6', 'box', 2),
('AI Solutions', 'ai-solutions', 'Artificial intelligence and machine learning', '#06b6d4', 'cpu', 3),
('Design', 'design', 'UI/UX and graphic design', '#f59e0b', 'palette', 4),
('Tutorials', 'tutorials', 'How-to guides and tutorials', '#10b981', 'book-open', 5);

-- Insert sample tags
INSERT INTO tags (name, slug, description, color) VALUES
('React', 'react', 'React.js framework', '#61dafb'),
('TypeScript', 'typescript', 'TypeScript programming language', '#3178c6'),
('Blender', 'blender', 'Blender 3D software', '#f5792a'),
('UI/UX', 'ui-ux', 'User interface and experience design', '#ff6b6b'),
('Machine Learning', 'machine-learning', 'ML and AI technologies', '#4ecdc4'),
('Three.js', 'threejs', 'Three.js 3D library', '#000000'),
('Tailwind CSS', 'tailwind-css', 'Tailwind CSS framework', '#38bdf8'),
('Next.js', 'nextjs', 'Next.js React framework', '#000000'),
('Supabase', 'supabase', 'Supabase backend platform', '#3ecf8e'),
('Animation', 'animation', 'Motion graphics and animations', '#ff9f43');

-- Note: In a real application, you would create users through the authentication system
-- This is just for development purposes
-- The actual user creation should be done through Supabase Auth

-- Insert sample contact submission for testing
INSERT INTO contact_submissions (
  name, 
  email, 
  subject, 
  message, 
  service_interest, 
  budget_range,
  timeline,
  source
) VALUES (
  'John Doe',
  'john.doe@example.com',
  'Website Development Inquiry',
  'Hi, I am interested in developing a modern e-commerce website for my business. Could you please provide more information about your services and pricing?',
  ARRAY['Web Design & Development', 'Branding & Graphic Design'],
  '$5,000 - $10,000',
  '2-3 months',
  'Google Search'
);