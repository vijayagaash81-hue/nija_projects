import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

public class SdfScriptPathUpdater {

    // SDF project location
    private static final Path PROJECT_PATH =
            Paths.get("C:\\Users\\EDWIN\\Documents\\SDF Core\\com.netsuite.hrmscore\\src");

    // Objects folder
    private static final Path OBJECTS_PATH =
            PROJECT_PATH.resolve("Objects");

    // Target SuiteApp path
    private static final String SUITEAPP_PATH =
            "/SuiteApps/com.netsuite.hrmscore/";

    /*
     * Matches:
     *
     * /SuiteBundles/Bundle 563694/HRIS Employee/employee.js
     * /SuiteBundles/Bundle 123456/HRIS Leave/leave.js
     *
     * /SuiteScripts/HRIS Employee/employee.js
     *
     * Everything after the Bundle number or SuiteScripts
     * is captured.
     */
    private static final Pattern SCRIPT_FILE_PATTERN =
            Pattern.compile(
                    "<scriptfile>\\[(?:/SuiteBundles/Bundle\\s+\\d+/|/SuiteScripts/)(.*?)\\]</scriptfile>",
                    Pattern.CASE_INSENSITIVE
            );

    public static void main(String[] args) {

        System.out.println("==============================================");
        System.out.println("       SDF SCRIPT PATH UPDATER");
        System.out.println("==============================================");

        System.out.println();
        System.out.println("Project:");
        System.out.println(PROJECT_PATH);

        System.out.println();
        System.out.println("Scanning Objects folder...");

        try {

            if (!Files.exists(OBJECTS_PATH)) {

                System.out.println();
                System.out.println("ERROR:");
                System.out.println("Objects folder not found:");
                System.out.println(OBJECTS_PATH);

                return;
            }

            try (Stream<Path> files = Files.walk(OBJECTS_PATH)) {

                files
                        .filter(Files::isRegularFile)
                        .filter(path ->
                                path.toString()
                                        .toLowerCase()
                                        .endsWith(".xml")
                        )
                        .forEach(SdfScriptPathUpdater::processXml);
            }

            System.out.println();
            System.out.println("==============================================");
            System.out.println("             PROCESS COMPLETED");
            System.out.println("==============================================");

        } catch (IOException e) {

            System.out.println();
            System.out.println("ERROR:");
            e.printStackTrace();
        }
    }

    private static void processXml(Path xmlFile) {

        try {

            String content = Files.readString(
                    xmlFile,
                    StandardCharsets.UTF_8
            );

            Matcher matcher =
                    SCRIPT_FILE_PATTERN.matcher(content);

            StringBuffer updatedContent =
                    new StringBuffer();

            boolean changed = false;

            while (matcher.find()) {

                // Everything after SuiteScripts/ or Bundle <number>/
                String remainingPath =
                        matcher.group(1);

                String newPath =
                        SUITEAPP_PATH + remainingPath;

                String oldPath =
                        matcher.group(0)
                                .replace(
                                        "<scriptfile>[",
                                        ""
                                )
                                .replace(
                                        "]</scriptfile>",
                                        ""
                                );

                String replacement =
                        "<scriptfile>[" +
                        newPath +
                        "]</scriptfile>";

                matcher.appendReplacement(
                        updatedContent,
                        Matcher.quoteReplacement(
                                replacement
                        )
                );

                System.out.println();
                System.out.println("----------------------------------------------");

                System.out.println("XML File:");
                System.out.println(xmlFile);

                System.out.println();

                System.out.println("OLD:");
                System.out.println(oldPath);

                System.out.println();

                System.out.println("NEW:");
                System.out.println(newPath);

                changed = true;
            }

            matcher.appendTail(updatedContent);

            if (changed) {

                Files.writeString(
                        xmlFile,
                        updatedContent.toString(),
                        StandardCharsets.UTF_8
                );

                System.out.println();
                System.out.println("STATUS: UPDATED");

            } else {

                System.out.println();
                System.out.println("XML File:");
                System.out.println(xmlFile.getFileName());

                System.out.println("STATUS: No matching scriptfile found");
            }

        } catch (IOException e) {

            System.out.println();
            System.out.println(
                    "ERROR processing XML: " +
                    xmlFile
            );

            e.printStackTrace();
        }
    }
}