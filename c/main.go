package main

import (
	"bytes"
	"context"
	"log"
	"net/http"
	"io/ioutil"

	"github.com/gin-gonic/gin"
	"github.com/dslipak/pdf"
	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/ollama"
)

func readPdf(data []byte) (string, error) {
	r, err := pdf.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", err
	}

	b, err := r.GetPlainText()
	if err != nil {
		return "", err
	}
	
	buf := new(bytes.Buffer)
	_, err = buf.ReadFrom(b)
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}

func generateEmail(c *gin.Context) {
    log.Println("Received a request to generate email")

	file, _, err := c.Request.FormFile("pdf")
    if err != nil {
        log.Printf("Error retrieving the PDF file from the form: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

    jobDescription := c.PostForm("jobDescription")

	defer file.Close()

    log.Println("Reading PDF file data")
	data, err := ioutil.ReadAll(file)
	if err != nil {
        log.Printf("Error reading the file data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

    log.Println("Converting PDF to plain text")
	content, err := readPdf(data) 
	if err != nil {
        log.Printf("Error converting PDF to plain text: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

    log.Println("Initializing Ollama LLM")
	llm, err := ollama.New(ollama.WithModel("llama2"))
	if err != nil {
        log.Printf("Error initializing Ollama: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	ctx := context.Background()
	prompt := fmt.Sprintf(
        "Create a very brief cold email highlighting my skills to the recruiter using the following resume: %s, to apply for the following job description (do not write about my years of experience, only write about technologies I have worked with and my internships): %s",
        content,
        jobDescription,
    )
    
    log.Println("Sending prompt to LLM")
	completion, err := llm.Call(ctx, prompt, llms.WithTemperature(0.8))
	if err != nil {
        log.Printf("Error while LLM processing the prompt: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

    log.Println("LLM response received, returning email content")
	c.JSON(http.StatusOK, gin.H{"email": completion})
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func main() {
	router := gin.Default()
	router.MaxMultipartMemory = 32 << 20 // 32 MiB
	router.Use(CORSMiddleware())
	router.POST("/generate-email", generateEmail)
	log.Println("Starting server on port 8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
