package com.eventsphere.backend.service;

import com.eventsphere.backend.entity.Attendance;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;

@Service
public class CertificateService {

    private static final int WIDTH = 1000;
    private static final int HEIGHT = 700;

    public byte[] generateCertificate(Attendance attendance) throws IOException {
        String participantName = attendance.getTicket().getRegistration().getUser().getName();
        String eventTitle = attendance.getTicket().getRegistration().getEvent().getTitle();
        String date = attendance.getCheckInTime().format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));

        BufferedImage image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Background
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, WIDTH, HEIGHT);

        // Border
        g.setColor(new Color(91, 71, 224)); // brand indigo
        g.setStroke(new BasicStroke(6));
        g.drawRect(30, 30, WIDTH - 60, HEIGHT - 60);

        // Title
        g.setColor(new Color(30, 27, 46));
        g.setFont(new Font("SansSerif", Font.BOLD, 34));
        drawCentered(g, "Certificate of Participation", WIDTH, 140);

        // "This certifies that"
        g.setFont(new Font("SansSerif", Font.PLAIN, 16));
        g.setColor(new Color(107, 101, 128));
        drawCentered(g, "This certifies that", WIDTH, 220);

        // Participant name
        g.setColor(new Color(91, 71, 224));
        g.setFont(new Font("SansSerif", Font.BOLD, 40));
        drawCentered(g, participantName, WIDTH, 290);

        // "attended"
        g.setColor(new Color(107, 101, 128));
        g.setFont(new Font("SansSerif", Font.PLAIN, 16));
        drawCentered(g, "attended", WIDTH, 350);

        // Event title
        g.setColor(new Color(30, 27, 46));
        g.setFont(new Font("SansSerif", Font.BOLD, 28));
        drawCentered(g, eventTitle, WIDTH, 400);

        // Date
        g.setFont(new Font("SansSerif", Font.PLAIN, 16));
        g.setColor(new Color(107, 101, 128));
        drawCentered(g, "on " + date, WIDTH, 440);

        // Footer
        g.setFont(new Font("SansSerif", Font.PLAIN, 14));
        drawCentered(g, "EventSphere", WIDTH, HEIGHT - 60);

        g.dispose();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }

    private void drawCentered(Graphics2D g, String text, int containerWidth, int y) {
        FontMetrics metrics = g.getFontMetrics();
        int x = (containerWidth - metrics.stringWidth(text)) / 2;
        g.drawString(text, x, y);
    }
}
