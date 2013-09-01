#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>

#ifdef WIN32
    #include <winsock2.h>
    #define bzero(b,len) (memset((b), '\0', (len)), (void) 0)  
    #define bcopy(b1,b2,len) (memmove((b2), (b1), (len)), (void) 0)
    #include <direct.h>
    #define GetCurrentDir _getcwd
#else
    #include <sys/types.h>
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <errno.h>
    #include <unistd.h>
    #define GetCurrentDir getcwd
#endif

void logFail(char* hash, char* type)
{
    char cwd[1024];
    if (GetCurrentDir(cwd, sizeof(cwd)) == NULL)
    {
        perror("GetCurrentDir() error");
        exit(0);
    }

    FILE *f = fopen(strcat(cwd,"/failed-txn.txt"), "ab");
    if (f == NULL)
    {
        printf("Error opening file!\n");
        exit(1);
    }


    fprintf(f, "%s-%s\n", type, hash);

    fclose(f);
}
int main(int argc, char *argv[])
{
    

    if (argc < 5) {
    	printf("\n Usage: %s <hostname> <port> <TxID> <currency>\n",argv[0]);
    	exit(0);
    }

    int sockfd, portno, n;
    struct sockaddr_in serv_addr;
    struct hostent *server;

    char buffer[256];

    portno = atoi(argv[2]);
    sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd < 0) {
    	fprintf(stderr,"ERROR, opening socket\n");
        logFail(argv[3],argv[4]);
    	exit(0);
    }
    server = gethostbyname(argv[1]);
    if (server == NULL) {
        fprintf(stderr,"ERROR, no such host\n");
        logFail(argv[3],argv[4]);
        exit(0);
    }
    bzero((char *) &serv_addr, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    bcopy((char *)server->h_addr, 
         (char *)&serv_addr.sin_addr.s_addr,
         server->h_length);
    serv_addr.sin_port = htons(portno);
    if (connect(sockfd,(struct sockaddr *) &serv_addr,sizeof(serv_addr)) < 0) {
    	fprintf(stderr,"ERROR, connecting\n");
        logFail(argv[3],argv[4]);
    	exit(0);
    }
    snprintf(buffer, sizeof(buffer), "{\"type\":\"%s\", \"hash\":\"%s\"}",argv[4],argv[3]);
    n = write(sockfd, buffer, strlen(buffer));
    if (n < 0) {
    	fprintf(stderr,"ERROR, writing to socket\n");
        logFail(argv[3],argv[4]);
    	exit(0);
    }
    close(sockfd); 
    return 0;
    exit(0);
}