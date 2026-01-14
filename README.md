# YouTube Transcript Summarizer

A simple web app that extracts transcripts from YouTube videos and generates concise summaries using Claude AI.

## Features

- **Transcript Extraction**: Automatically retrieves transcripts from YouTube videos
- - **AI Summarization**: Uses Claude 3.5 Sonnet to generate intelligent summaries
  - - **Simple Interface**: Clean, intuitive web interface
    - - **Easy to Use**: Just paste a YouTube URL and get results
     
      - ## Tech Stack
     
      - **Backend:**
      - - Node.js + Express
        - - Anthropic Claude API
          - - youtube-transcript-api (npm)
           
            - **Frontend:**
            - - React
              - - TailwindCSS
                - - Axios
                 
                  - **Deployment:**
                  - - Vercel
                   
                    - ## Setup Instructions
                   
                    - ### Prerequisites
                    - - Node.js 14+
                      - - npm or yarn
                        - - Anthropic API key (get one at https://console.anthropic.com)
                         
                          - ### Local Development
                         
                          - 1. **Clone the repository:**
                            2. ```bash
                               git clone https://github.com/yourusername/youtube-transcript-summarizer.git
                               cd youtube-transcript-summarizer
                               ```

                               2. **Install backend dependencies:**
                               3. ```bash
                                  npm install
                                  ```

                                  3. **Create .env file in root:**
                                  4. ```
                                     ANTHROPIC_API_KEY=your_api_key_here
                                     PORT=3001
                                     ```

                                     4. **Install frontend dependencies:**
                                     5. ```bash
                                        cd client
                                        npm install
                                        cd ..
                                        ```

                                        5. **Run the app:**
                                        6. ```bash
                                           npm run dev
                                           ```

                                           This will start both the backend server (port 3001) and React frontend (port 3000).

                                           ### Deployment to Vercel

                                           1. **Push your code to GitHub**
                                          
                                           2. 2. **Connect to Vercel:**
                                              3.    - Go to https://vercel.com
                                                    -    - Import your GitHub repository
                                                         -    - Set environment variables:
                                                              -      - `ANTHROPIC_API_KEY`: Your API key from Anthropic
                                                          
                                                              -  3. **Deploy!**
                                                               
                                                                 4. ## How It Works
                                                               
                                                                 5. 1. User pastes a YouTube URL
                                                                    2. 2. App extracts the video ID from the URL
                                                                       3. 3. Backend fetches the transcript using youtube-transcript-api
                                                                          4. 4. User can view the full transcript
                                                                             5. 5. Claude AI summarizes the transcript
                                                                                6. 6. Summary is displayed in the UI
                                                                                  
                                                                                   7. ## API Endpoints
                                                                                  
                                                                                   8. ### GET /api/health
                                                                                   9. Health check endpoint
                                                                                  
                                                                                   10. ### POST /api/transcript
                                                                                   11. Extracts transcript from a YouTube video
                                                                                   12. - Request: `{ "url": "https://youtube.com/watch?v=..." }`
                                                                                       - - Response: `{ "transcript": "...", "success": true }`
                                                                                        
                                                                                         - ### POST /api/summarize
                                                                                         - Summarizes a provided transcript
                                                                                         - - Request: `{ "transcript": "..." }`
                                                                                           - - Response: `{ "summary": "...", "success": true }`
                                                                                            
                                                                                             - ## Project Structure
                                                                                            
                                                                                             - ```
                                                                                               youtube-transcript-summarizer/
                                                                                               ├── server/
                                                                                               │   └── index.js              # Express server
                                                                                               ├── client/
                                                                                               │   ├── public/
                                                                                               │   ├── src/
                                                                                               │   │   ├── components/
                                                                                               │   │   ├── App.js
                                                                                               │   │   └── index.js
                                                                                               │   └── package.json
                                                                                               ├── package.json              # Backend dependencies
                                                                                               ├── .env.example
                                                                                               ├── .gitignore
                                                                                               └── README.md
                                                                                               ```

                                                                                               ## Environment Variables

                                                                                               Create a `.env` file in the root directory:

                                                                                               ```
                                                                                               ANTHROPIC_API_KEY=sk-ant-...
                                                                                               PORT=3001
                                                                                               ```

                                                                                               ## Troubleshooting

                                                                                               ### "No transcript found"
                                                                                               - The video may not have captions enabled
                                                                                               - - Try a different video with captions
                                                                                                
                                                                                                 - ### "API Key not configured"
                                                                                                 - - Make sure your `ANTHROPIC_API_KEY` is set in the .env file
                                                                                                   - - Check that your API key is valid
                                                                                                    
                                                                                                     - ### CORS Errors
                                                                                                     - - The backend should have CORS enabled
                                                                                                       - - Check that frontend is calling the correct API URL
                                                                                                        
                                                                                                         - ## License
                                                                                                        
                                                                                                         - MIT
                                                                                                        
                                                                                                         - ## Contributing
                                                                                                        
                                                                                                         - Feel free to submit issues and enhancement requests!
                                                                                                        
                                                                                                         - ## Support
                                                                                                        
                                                                                                         - If you have questions or need help, please open an issue on GitHub.
