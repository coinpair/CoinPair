#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h> 
#include <errno.h>

void logFail(char* hash, char* type, char* port)
{
    FILE *f = fopen("/root/CoinPair/failed-err.txt", "ab");
    if (f == NULL)
    {
        printf("Error opening file!\n");
        exit(1);
    }


    fprintf(f, "type: %s hash: %s port: %s\n", type, hash, port);

    fclose(f);
}
int main(int argc, char *argv[])
{
    
    
    if (argc < 4) {
    	printf("\n Usage: %s <hostname> <port> <TxID> \n",argv[0]);
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
        logFail(argv[3],argv[4], argv[2]);
    	exit(0);
    }
    server = gethostbyname(argv[1]);
    if (server == NULL) {
        fprintf(stderr,"ERROR, no such host\n");
        logFail(argv[3],argv[4], argv[2]);
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
        logFail(argv[3],argv[4], argv[2]);
    	exit(0);
    }
    snprintf(buffer, sizeof(buffer), "{\"type\":\"%s\", \"hash\":\"%s\"}",argv[4],argv[3]);
    n = write(sockfd, buffer, strlen(buffer));
    if (n < 0) {
    	fprintf(stderr,"ERROR, writing to socket\n");
        logFail(argv[3],argv[4], argv[2]);
    	exit(0);
    }
    close(sockfd); 
    return 0;
    exit(0);
}